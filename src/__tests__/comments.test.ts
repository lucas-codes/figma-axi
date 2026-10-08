import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {run} from './harness.ts';
import {comments, endpoint, model, goldenCases} from './fixtures/comments.ts';
async function json(body: unknown, flags: string[] = []) {
  const result = await run(['comments', 'AbC123xyz456', ...flags, '--json'], {[endpoint]: {body}});
  assert.equal(result.exit, 0, result.output);
  return JSON.parse(result.output);
}
for (const [name, scenario] of Object.entries(goldenCases)) test('literal stdout: ' + name, async () => {
  const result = await run(scenario.argv, scenario.routes);
  assert.equal(result.exit, 0, result.output);
  assert.equal(result.output, readFileSync(new URL('./goldens/' + name + '.txt', import.meta.url), 'utf8') + '\n');
  assert.deepEqual(await json(scenario.routes[endpoint].body), scenario.model);
});
test('resolved root includes its replies, and counts before limiting', async () => {
  const result = await json(comments, ['--resolved']);
  assert.deepEqual(result, {...model, resolvedHidden: 0, comments: [
    {id: '104', parent: null, node: null, author: 'ana', created: '2026-10-03', message: 'Update the title'},
    {id: '105', parent: '104', node: null, author: 'lucas', created: '2026-10-04', message: 'Done'},
    ...model.comments,
  ], help: [model.help[1]]});
  assert.deepEqual(await json(comments, ['--limit', '1']), {...model, comments: [model.comments[0]], help: [
    ...model.help,
    'Run `figma-axi comments AbC123xyz456 --full` for all rows (2 rows omitted by --limit)',
  ]});
});
test('roots newest first and replies oldest first, independent of API order', async () => {
  const reply = {...comments.comments[0], id: '103', created_at: '2026-10-02T11:00:00Z', resolved_at: '2026-10-03T10:00:00Z'};
  const result = await json({comments: [reply, ...comments.comments]});
  assert.deepEqual(result.comments, [...model.comments, {...model.comments[2], id: '103', created: '2026-10-02'}]);
  assert.equal(result.resolvedHidden, 2);
});
test('FrameOffsetRegion pins, canvas Region does not, and API strings are sanitized', async () => {
  const result = await json({comments: [
    {...comments.comments[2], id: '\u001b[31m101', user: {handle: 'a\tna'}, message: 'hello\nworld\u0000', client_meta: {node_id: '\u001b[31m1:12', node_offset: {x: 1, y: 2}, region_width: 10, region_height: 20}},
    {...comments.comments[4], client_meta: {x: 0, y: 0, region_width: 10, region_height: 20}},
  ]});
  assert.deepEqual(result.comments, [model.comments[0], {...model.comments[1], author: 'a na', message: 'hello world'}]);
});
test('500 characters is uncut, 501 is cut; --full bypasses text and row limits', async () => {
  const body = {comments: [{...comments.comments[2], message: 'a'.repeat(501)}, {...comments.comments[4], message: 'b'.repeat(500)}]};
  assert.deepEqual(await json(body), {...model, total: 2, resolvedHidden: 0, comments: [
    {...model.comments[0], message: 'b'.repeat(500)}, {...model.comments[1], message: 'a'.repeat(500)},
  ], help: [model.help[1], 'Run `figma-axi comments AbC123xyz456 --full` for uncut messages']});
  assert.deepEqual(await json(body, ['--full', '--limit', '1']), {...model, total: 2, resolvedHidden: 0, comments: [
    {...model.comments[0], message: 'b'.repeat(500)}, {...model.comments[1], message: 'a'.repeat(501)},
  ], help: [model.help[1]]});
});
test('default limit is 100 and --full removes it', async () => {
  const body = {comments: Array.from({length: 101}, (_, i) => ({...comments.comments[2], id: String(i)}))};
  const limited = await json(body);
  assert.equal(limited.total, 101);
  assert.deepEqual(limited.comments.map((row: {id: string}) => row.id), Array.from({length: 100}, (_, i) => String(i)));
  assert.equal(limited.help[1], 'Run `figma-axi comments AbC123xyz456 --full` for all rows (1 rows omitted by --limit)');
  assert.deepEqual((await json(body, ['--full'])).comments.map((row: {id: string}) => row.id), Array.from({length: 101}, (_, i) => String(i)));
});
const root = comments.comments[2];
for (const [name, body] of Object.entries({
  envelope: {}, array: {comments: {}}, comment: {comments: [null]}, id: {comments: [{...root, id: 1}]},
  parent: {comments: [{...root, parent_id: 1}]}, user: {comments: [{...root, user: {handle: 1}}]},
  date: {comments: [{...root, created_at: 'invalid'}]}, resolved: {comments: [{...root, resolved_at: 1}]},
  message: {comments: [{...root, message: null}]}, metadata: {comments: [{...root, client_meta: 1}]},
  node: {comments: [{...root, client_meta: {node_id: 'bad', node_offset: {x: 0, y: 0}}}]},
  offset: {comments: [{...root, client_meta: {node_id: '1:12', node_offset: {x: '0', y: 0}}}]},
  duplicate: {comments: [root, root]},
  cycle: {comments: [{...root, parent_id: '101'}]},
  resolvedDate: {comments: [{...root, resolved_at: 'invalid'}]},
})) test('bad_response for malformed ' + name, async () => {
  const result = await run(['comments', 'AbC123xyz456', '--json'], {[endpoint]: {body}});
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {error: 'Invalid comments response', code: 'bad_response', help: ['Check the Figma API response']});
});
test('all resolved is not mistaken for zero comments', async () => {
  assert.deepEqual(await json({comments: [comments.comments[1], comments.comments[3]]}), {
    file: 'AbC123xyz456', total: 2, resolvedHidden: 2, comments: [], help: [model.help[0]],
  });
});
test('comment token echoes are refused without leaking', async () => {
  const result = await run(['comments', 'AbC123xyz456', '--json'], {[endpoint]: {body: {comments: [{...root, message: 'figd_DUMMY_SECRET'}]}}});
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {error: 'Secret detected in output', code: 'security', help: ['Check the response content before retrying']});
});
