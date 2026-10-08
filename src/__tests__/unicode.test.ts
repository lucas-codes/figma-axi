import test from 'node:test';
import assert from 'node:assert/strict';
import {decode} from '@toon-format/toon';
import {run} from './harness.ts';
import {REGISTRY} from '../registry.ts';
const nodes = 'https://api.figma.com/v1/files/AbC123xyz456/nodes?ids=1%3A2&depth=5';
const comments = 'https://api.figma.com/v1/files/AbC123xyz456/comments?as_md=true';
for (const [name, characters, expected, truncated] of [
  ['emoji at text boundary', 'a'.repeat(199) + '😀tail', 'a'.repeat(199) + '😀', 1],
  ['API lone surrogates', 'left\ud800mid\udc00right', 'left�mid�right', 0],
] as const) test(name + ' survives inspect TOON and JSON', async () => {
  for (const json of [false, true]) {
    const result = await run(['inspect', 'AbC123xyz456', '--node', '1-2', ...(json ? ['--json'] : [])],
      {[nodes]: {body: {name: 'File', nodes: {'1:2': {components: {}, document: {id: '1:2', type: 'TEXT', name: 'Text', characters}}}}}});
    assert.equal(result.exit, 0, result.output);
    assert.deepEqual(json ? JSON.parse(result.output) : decode(result.output), {
      file: 'File', node: '1-2', depth: 5, hidden: 0, shapesOmitted: 0, beyondLimit: 0, textsTruncated: truncated,
      nodes: [{depth: 0, id: '1-2', type: 'TEXT', name: 'Text', size: null, content: expected}],
      help: ['Run `figma-axi render AbC123xyz456 --node 1-2` to see this frame'],
    });
  }
});
test('emoji at message boundary survives comments TOON and JSON', async () => {
  for (const json of [false, true]) {
    const result = await run(['comments', 'AbC123xyz456', ...(json ? ['--json'] : [])], {[comments]: {body: {comments: [
      {id: '1', user: {handle: 'ana'}, client_meta: {x: 0, y: 0}, created_at: '2026-10-01T00:00:00Z', message: 'a'.repeat(499) + '😀'},
    ]}}});
    assert.equal(result.exit, 0, result.output);
    assert.deepEqual(json ? JSON.parse(result.output) : decode(result.output), {
      file: 'AbC123xyz456', total: 1, resolvedHidden: 0,
      comments: [{id: '1', parent: null, node: null, author: 'ana', created: '2026-10-01', message: 'a'.repeat(499) + '😀'}], help: [],
    });
  }
});
test('unexpected handler failure reports internal_error without reflecting the exception', async t => {
  const original = REGISTRY.comments.run;
  t.after(() => { REGISTRY.comments.run = original; });
  REGISTRY.comments.run = async () => { throw new Error('private implementation detail'); };
  const result = await run(['comments', 'AbC123xyz456', '--json']);
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {error: 'Unexpected internal error', code: 'internal_error',
    help: ['This is a figma-axi bug; re-run with --json and report the output']});
});
