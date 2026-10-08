import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {run} from './harness.ts';
import {endpoint} from './fixtures/comments.ts';
import {png} from './fixtures/images.ts';
test('message-only truncation does not claim zero rows were omitted', async () => {
  const result = await run(['comments', 'AbC123xyz456', '--json'], {[endpoint]: {body: {comments: [
    {id: '1', client_meta: {x: 0, y: 0}, user: {handle: 'ana'}, created_at: '2026-10-01T00:00:00Z', message: 'x'.repeat(501)},
  ]}}});
  assert.equal(result.exit, 0, result.output);
  assert.deepEqual(JSON.parse(result.output), {file: 'AbC123xyz456', total: 1, resolvedHidden: 0,
    comments: [{id: '1', parent: null, node: null, author: 'ana', created: '2026-10-01', message: 'x'.repeat(500)}],
    help: ['Run `figma-axi comments AbC123xyz456 --full` for uncut messages']});
});
test('render write failure directs the user to a writable output directory', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'write-failure-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  await mkdir(join(dir, 'AbC123xyz456', '1-2@1x.png'), {recursive: true});
  const result = await run(['render', 'AbC123xyz456', '--node', '1-2', '--out', dir, '--json'], {
    'https://api.figma.com/v1/images/AbC123xyz456?ids=1%3A2&format=png&scale=1': {body: {err: null, images: {'1:2': 'https://images.example.test/a'}}},
    'https://images.example.test/a': {bytes: png, contentType: 'image/png'},
  });
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {error: 'Could not write the rendered image', code: 'download_failed',
    help: ['Check that --out points at a writable directory']});
});
