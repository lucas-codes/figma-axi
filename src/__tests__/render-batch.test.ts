import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {run, env} from './harness.ts';
import {png} from './fixtures/images.ts';
const api = 'https://api.figma.com/v1/images/AbC123xyz456?ids=1%3A2%2C1%3A3%2C1%3A4&format=png&scale=1';
test('batch deduplicates normalized ids in order and saves each image', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'batch-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const result = await run(['render', 'AbC123xyz456', '--node', '1-2,1:3,1-2,1-4', '--out', dir, '--json'], {
    [api]: {body: {images: {'1:2': 'https://images.example.test/a', '1:3': 'https://images.example.test/a', '1:4': 'https://images.example.test/a'}}},
    'https://images.example.test/a': {bytes: png, contentType: 'image/png'},
  });
  assert.equal(result.exit, 0);
  assert.deepEqual(JSON.parse(result.output), {images: ['1-2','1-3','1-4'].map(node => ({node, path: join(dir, 'AbC123xyz456', node + '@1x.png'), format: 'png', bytes: 68})), help: ['Read the image at path; re-run with --scale 2 for finer detail']});
  assert.deepEqual(await readFile(join(dir, 'AbC123xyz456/1-3@1x.png')), png);
  assert.equal(result.calls[0]?.url, api);
  assert.equal(new Headers(result.calls[1]?.init?.headers).has('X-Figma-Token'), false);
});
test('one null in batch refuses all downloads before writing', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'batch-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const result = await run(['render', 'AbC123xyz456', '--node', '1-2,1-3,1-4', '--out', dir, '--json'], {
    [api]: {body: {images: {'1:2': 'https://images.example.test/a', '1:3': null, '1:4': null}}},
  }, env);
  assert.deepEqual(JSON.parse(result.output), {error: 'Figma could not render node 1-3, 1-4', code: 'render_failed', help: ['Check the node can be rendered in Figma']});
  assert.equal(result.exit, 1);
  assert.deepEqual(await readdir(dir), []);
  assert.equal(result.calls.length, 1);
});
test('invalid batch member is rejected before network', async () => {
  const result = await run(['render', 'AbC123xyz456', '--node', '1-2,', '--json']);
  assert.equal(result.exit, 2);
  assert.equal(JSON.parse(result.output).code, 'usage');
  assert.equal(result.calls.length, 0);
});
