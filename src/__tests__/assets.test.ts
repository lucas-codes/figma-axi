import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm, mkdir, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {run, env, type Reply} from './harness.ts';
import {png} from './fixtures/images.ts';
const ref = createHash('sha1').update(png).digest('hex');
const missing = 'a'.repeat(40);
const nodes = 'https://api.figma.com/v1/files/AbC123xyz456/nodes?ids=1%3A2';
const fills = 'https://api.figma.com/v1/files/AbC123xyz456/images';
const url = 'https://fills.example.test/photo.svg';
const argv = ['assets', 'AbC123xyz456', '--node', '1-2', '--json'];
const paint = (imageRef = ref) => ({type: 'IMAGE', imageRef, scaleMode: 'FILL'});
const document = {id: '1:2', type: 'FRAME', name: 'Frame', children: [
  {id: '1:3', type: 'RECTANGLE', name: 'Photo', fills: [paint(), paint()]},
  {id: '1:4', type: 'INSTANCE', name: 'Instance', children: [{id: '1:5', type: 'VECTOR', name: 'Nested photo', fills: [paint()]}]},
  {id: '1:6', type: 'RECTANGLE', name: 'Hidden', visible: false, fills: [paint(missing)]},
]};
function routes(doc: unknown = document): Record<string, Reply> {return {
  [nodes]: {body: {name: 'Fixture', nodes: {'1:2': {document: doc, components: {}}}}},
  [fills]: {body: {error: false, status: 200, meta: {images: {[ref]: url, unused: 'http://ignored.test'}}}},
  [url]: {bytes: png, contentType: 'text/plain'},
};}
async function temp(t: import('node:test').TestContext) {
  const dir = await mkdtemp(join(tmpdir(), 'assets-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  return dir;
}
test('saves deduplicated fills through instance and vector internals, then caches without fetching', async t => {
  const dir = await temp(t);
  const out = join(dir, 'AbC123xyz456/fills');
  const path = join(out, ref + '.png');
  const first = await run([...argv, '--out', dir], routes());
  assert.equal(first.exit, 0);
  const expected = {file: 'Fixture', node: '1-2', out, found: 1, saved: 1, cached: 0, missing: 0, beyondLimit: 0,
    images: [{imageRef: ref, status: 'saved', format: 'png', bytes: 68, layer: '1-3', uses: 2, path}],
    help: ['Read each image at path; files are named by imageRef, so a re-run reuses them', 'Run `figma-axi render AbC123xyz456 --node <id> --format svg` for icons and vectors, which are not image fills']};
  assert.deepEqual(JSON.parse(first.output), expected);
  assert.deepEqual(await readFile(path), png);
  assert.deepEqual(Object.fromEntries(new Headers(first.calls[2]?.init?.headers)), {accept: 'image/*'});
  assert.equal(first.output.includes(env.FIGMA_TOKEN), false);
  const again = await run([...argv, '--out', dir], {[nodes]: routes()[nodes]!, [fills]: {body: {meta: {images: {}}}}});
  assert.equal(again.exit, 0);
  assert.deepEqual(JSON.parse(again.output), {...expected, saved: 0, cached: 1, images: [{...expected.images[0], status: 'cached'}]});
  assert.equal(again.calls.length, 2);
});
test('gifRef wins; absent reference is a missing row and limit counts distinct refs', async t => {
  const dir = await temp(t);
  const doc = {id: '1:2', name: 'Frame', type: 'FRAME', fills: [{...paint(), gifRef: missing}], children: [{id: '1:3', type: 'RECTANGLE', name: 'Other', fills: [paint()]}]};
  const result = await run([...argv, '--out', dir, '--limit', '1'], routes(doc));
  assert.equal(result.exit, 0);
  const model = JSON.parse(result.output);
  assert.deepEqual(model.images, [{imageRef: missing, status: 'missing', format: null, bytes: null, layer: '1-2', uses: 1, path: null}]);
  assert.deepEqual([model.found, model.saved, model.cached, model.missing, model.beyondLimit], [2, 0, 0, 1, 1]);
  assert.match(model.help.join(' '), /--limit/);
  assert.equal(result.calls.length, 2);
});
for (const [reply, code] of [[{bytes: Buffer.concat([png, Buffer.from('wrong')]), contentType: 'image/png'}, 'download_failed'], [{bytes: png, contentType: 'image/png', status: 302}, 'security']] as const)
  test('download refusal writes nothing: ' + code, async t => {
    const dir = await temp(t);
    const result = await run([...argv, '--out', dir], {...routes(), [url]: reply});
    assert.equal(result.exit, 1);
    assert.equal(JSON.parse(result.output).code, code);
    assert.deepEqual(await readdir(dir), []);
  });
test('tampered bytes report integrity failure before format sniffing, with neutral recovery advice', async t => {
  const dir = await temp(t);
  const result = await run([...argv, '--out', dir], {...routes(), [url]: {bytes: Buffer.from('tampered'), contentType: 'text/plain'}});
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {error: 'Image fill SHA-1 does not match imageRef', code: 'download_failed',
    help: ['Re-run the command to request a fresh image']});
  assert.deepEqual(await readdir(dir), []);
});
test('assets redirects give command-neutral diagnostics', async t => {
  const dir = await temp(t);
  const redirected = await run([...argv, '--out', dir], {...routes(), [url]: {bytes: png, contentType: 'image/png', status: 302}});
  assert.equal(redirected.exit, 1);
  assert.deepEqual(JSON.parse(redirected.output), {error: 'Image redirect refused', code: 'security',
    help: ['Re-run the command to request a direct image URL']});
});
test('corrupt cache is repaired and unchanged files are reused', async t => {
  const dir = await temp(t), out = join(dir, 'AbC123xyz456/fills');
  await mkdir(out, {recursive: true});
  await writeFile(join(out, ref + '.png'), 'corrupt');
  const result = await run([...argv, '--out', dir], routes());
  assert.equal(result.exit, 0);
  assert.equal(JSON.parse(result.output).saved, 1);
  assert.deepEqual(await readFile(join(out, ref + '.png')), png);
  assert.deepEqual(await readdir(out), [ref + '.png']);
});
test('first failed fill aborts sequential downloads', async t => {
  const dir = await temp(t);
  const doc = {id: '1:2', name: 'Frame', type: 'FRAME', fills: [paint(), paint(missing)]};
  const result = await run([...argv, '--out', dir], {...routes(doc),
    [fills]: {body: {meta: {images: {[ref]: url, [missing]: 'https://fills.example.test/second'}}}},
    [url]: {bytes: Buffer.concat([png, Buffer.from('wrong')]), contentType: 'image/png'},
  });
  assert.equal(result.exit, 1);
  assert.equal(JSON.parse(result.output).code, 'download_failed');
  assert.deepEqual(result.calls.map(c => c.url), [nodes, fills, url]);
  assert.deepEqual(await readdir(dir), []);
});
test('empty subtree yields an explicit empty model without image downloads', async t => {
  const dir = await temp(t);
  const result = await run([...argv, '--out', dir], routes({id: '1:2', name: 'Empty', type: 'FRAME'}));
  assert.equal(result.exit, 0);
  const model = JSON.parse(result.output);
  assert.deepEqual([model.found, model.saved, model.cached, model.missing, model.beyondLimit, model.images], [0, 0, 0, 0, 0, []]);
  assert.equal(result.calls.length, 2);
});
for (const body of [null, {}, {meta: {images: []}}, {meta: {images: {[ref]: 12}}}])
  test('malformed fills map is bad_response: ' + JSON.stringify(body), async t => {
    const dir = await temp(t);
    const result = await run([...argv, '--out', dir], {...routes(), [fills]: {body}});
    assert.equal(result.exit, 1);
    assert.equal(JSON.parse(result.output).code, 'bad_response');
    assert.deepEqual(await readdir(dir), []);
  });
