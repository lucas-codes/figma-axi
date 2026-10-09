import test, {type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {run, env, type Reply} from './harness.ts';
import {goldenCases, images, imageApi, png, jpg, svg} from './fixtures/images.ts';
const argv = ['render', 'AbC123xyz456', '--node', '1-2'];
async function temporary(t: TestContext) {
  const dir = await mkdtemp(join(tmpdir(), 'render-test-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  return dir;
}
test('render literal TOON golden and written PNG', async () => {
  const s = goldenCases.render;
  const result = await run(s.argv, s.routes, env, s.tmpdir);
  assert.equal(result.exit, 0);
  assert.equal(result.output, await readFile(new URL('./goldens/render.txt', import.meta.url), 'utf8') + '\n');
  assert.deepEqual(await readFile(s.model.images[0]!.path), png);
  assert.equal(result.output.includes(env.FIGMA_TOKEN), false);
});
test('deterministic path, API-form id, unauthenticated download and overwrite', async t => {
  const dir = await temporary(t);
  const url = 'https://api.figma.com/frame.png';
  const routes: Record<string, Reply> = {
    [imageApi]: {body: {err: null, images: {'1:2': url}}},
    [url]: {bytes: png, contentType: 'image/png'},
  };
  const result = await run([...argv, '--json'], routes, env, dir);
  const path = join(dir, 'figma-axi/AbC123xyz456/1-2@1x.png');
  assert.equal(result.exit, 0);
  assert.deepEqual(JSON.parse(result.output), {images: [{node: '1-2', path, format: 'png', bytes: 68}], help: ['Read the image at path; re-run with --scale 2 for finer detail', 'SVG is for icons and vectors; use `spec` for layout and `assets` for photos']});
  assert.deepEqual(await readFile(path), png);
  assert.equal(result.calls[0]?.url, imageApi);
  assert.deepEqual(Object.fromEntries(new Headers(result.calls[1]?.init?.headers)), {accept: 'image/png'});
  assert.equal(result.calls[1]?.init?.redirect, 'manual');
  const updated = Buffer.concat([png, Buffer.from('updated')]);
  routes[url] = {bytes: updated, contentType: 'image/png'};
  const again = await run([...argv, '--json'], routes, env, dir);
  assert.equal(again.exit, 0);
  assert.equal(JSON.parse(again.output).images[0].path, path);
  assert.equal(JSON.parse(again.output).images[0].bytes, 75);
  assert.deepEqual(await readFile(path), updated);
  assert.deepEqual(await readdir(join(dir, 'figma-axi/AbC123xyz456')), ['1-2@1x.png']);
});
for (const [format, bytes, contentType] of [['jpg', jpg, 'image/jpeg'], ['svg', svg, 'image/svg+xml']] as const)
  test('format, scale and explicit output: ' + format, async t => {
    const dir = await temporary(t);
    const api = 'https://api.figma.com/v1/images/AbC123xyz456?ids=1%3A2&format=' + format + '&scale=2';
    const result = await run([...argv, '--format', format, '--scale', '2', '--out', dir, '--json'], {
      [api]: {body: images}, 'https://images.example.test/frame.png': {bytes, contentType},
    });
    assert.equal(result.exit, 0);
    const path = join(dir, 'AbC123xyz456/1-2@2x.' + format);
    assert.deepEqual(JSON.parse(result.output), {images: [{node: '1-2', path, format, bytes: bytes.length}], help: ['Read the image at path; re-run with --scale 2 for finer detail', 'SVG is for icons and vectors; use `spec` for layout and `assets` for photos']});
    assert.deepEqual(await readFile(path), Buffer.from(bytes));
  });
for (const body of [{err: null, images: {'1:2': null}}, {err: null, images: {}}])
  test('null or missing image gives render_failed', async () => {
    const result = await run([...argv, '--json'], {[imageApi]: {body}});
    assert.equal(result.exit, 1);
    assert.equal(JSON.parse(result.output).code, 'render_failed');
  });
test('render failure includes sanitized bounded Figma error', async () => {
  const result = await run([...argv, '--json'], {[imageApi]: {body: {images: {'1:2': null}, err: '\u001b[31m' + 'x'.repeat(250) + '\u001b[0m'}}});
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {error: 'Figma could not render node 1-2: ' + 'x'.repeat(200), code: 'render_failed', help: ['Check the node can be rendered in Figma']});
});
for (const body of [null, [], {}, {images: null}, {images: []}, {images: {'1:2': 123}}, {images: {}, err: 123}])
  test('malformed image response gives bad_response: ' + JSON.stringify(body), async () => {
    const result = await run([...argv, '--json'], {[imageApi]: {body}});
    assert.equal(result.exit, 1);
    assert.equal(JSON.parse(result.output).code, 'bad_response');
  });
for (const body of [
  {err: env.FIGMA_TOKEN, images: {'1:2': null}},
  {err: null, images: {'1:2': 'https://images.example.test/image?token=' + env.FIGMA_TOKEN}},
])
  test('API token echo is refused without stdout leakage', async () => {
    const result = await run([...argv, '--json'], {[imageApi]: {body}});
    assert.equal(result.exit, 1);
    assert.equal(JSON.parse(result.output).code, 'security');
    assert.equal(result.output.includes(env.FIGMA_TOKEN), false);
  });
for (const [url, reply, code] of [
  ['http://images.example.test/a', {bytes: png, contentType: 'image/png'}, 'security'],
  ['https://images.example.test/a', {bytes: jpg, contentType: 'image/jpeg'}, 'download_failed'],
  ['https://images.example.test/a', {bytes: png, contentType: 'image/png', status: 302}, 'security'],
] as const)
  test('render propagates download refusal: ' + code + ' ' + url, async t => {
    const dir = await temporary(t);
    const result = await run([...argv, '--json'], {[imageApi]: {body: {images: {'1:2': url}}}, [url]: reply}, env, dir);
    assert.equal(result.exit, 1);
    assert.equal(JSON.parse(result.output).code, code);
    assert.deepEqual(await readdir(dir), []);
  });
