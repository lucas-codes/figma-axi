import test from 'node:test';
import assert from 'node:assert/strict';
import {decode} from '@toon-format/toon';
import {run} from './harness.ts';
import {endpoint} from './fixtures/comments.ts';
const root = {id: '1', client_meta: {x: 0, y: 0}, user: {handle: 'ana'}, created_at: '2026-10-01T10:00:00Z', message: 'Root'};
for (const [name, patch, parent, created] of [
  ['offset timestamps', {created_at: '2026-10-01T23:00:00-02:00', resolved_at: '2026-10-03T10:00:00+00:00'}, null, '2026-10-02'],
  ['null root parent', {parent_id: null}, null, '2026-10-01'],
  ['orphan reply', {parent_id: '99'}, '99', '2026-10-01'],
] as const) test('comments accept ' + name, async () => {
  const result = await run(['comments', 'AbC123xyz456', '--resolved'], {[endpoint]: {body: {comments: [{...root, ...patch}]}}});
  assert.equal(result.exit, 0, result.output);
  assert.deepEqual(decode(result.output), {file: 'AbC123xyz456', total: 1, resolvedHidden: 0,
    comments: [{id: '1', parent, node: null, author: 'ana', created, message: 'Root'}], help: []});
});
test('orphan thread occupies root position and keeps its replies ordered', async () => {
  const result = await run(['comments', 'AbC123xyz456', '--json'], {[endpoint]: {body: {comments: [
    {...root, id: '3', parent_id: '2', created_at: '2026-10-03T00:00:00Z', message: 'Reply'},
    root,
    {...root, id: '2', parent_id: '99', created_at: '2026-10-02T00:00:00Z', message: 'Orphan'},
  ]}}});
  assert.equal(result.exit, 0, result.output);
  assert.deepEqual(JSON.parse(result.output), {file: 'AbC123xyz456', total: 3, resolvedHidden: 0, comments: [
    {id: '2', parent: '99', node: null, author: 'ana', created: '2026-10-02', message: 'Orphan'},
    {id: '3', parent: '2', node: null, author: 'ana', created: '2026-10-03', message: 'Reply'},
    {id: '1', parent: null, node: null, author: 'ana', created: '2026-10-01', message: 'Root'},
  ], help: []});
});
