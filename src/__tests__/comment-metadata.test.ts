import test from 'node:test';
import assert from 'node:assert/strict';
import {decode} from '@toon-format/toon';
import {run} from './harness.ts';
import {endpoint} from './fixtures/comments.ts';
for (const metadata of [{}, {client_meta: null}]) test('comments accept absent pin ' + JSON.stringify(metadata), async () => {
  const result = await run(['comments', 'AbC123xyz456'], {[endpoint]: {body: {comments: [
    {id: '1', user: {handle: 'ana'}, created_at: '2026-10-01T00:00:00Z', message: 'Unpinned', ...metadata},
  ]}}});
  assert.equal(result.exit, 0, result.output);
  assert.deepEqual(decode(result.output), {file: 'AbC123xyz456', total: 1, resolvedHidden: 0,
    comments: [{id: '1', parent: null, node: null, author: 'ana', created: '2026-10-01', message: 'Unpinned'}], help: []});
});
for (const client_meta of [1, 'bad', [], {}, {node_id: 'bad', node_offset: {x: 0, y: 0}}])
  test('comments still reject malformed pin ' + JSON.stringify(client_meta), async () => {
    const result = await run(['comments', 'AbC123xyz456', '--json'], {[endpoint]: {body: {comments: [
      {id: '1', user: {handle: 'ana'}, created_at: '2026-10-01T00:00:00Z', message: 'Unpinned', client_meta},
    ]}}});
    assert.equal(result.exit, 1);
    assert.deepEqual(JSON.parse(result.output), {error: 'Invalid comments response', code: 'bad_response', help: ['Check the Figma API response']});
  });
