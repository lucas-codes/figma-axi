import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {run} from './harness.ts';
import {file} from './fixtures/file-depth2.ts';
import {endpoint} from './fixtures/comments.ts';
test('outline ignores malformed URL node-id and returns the outline golden', async () => {
  const result = await run(['outline', 'https://www.figma.com/design/AbC123xyz456/X?node-id=abc'],
    {'https://api.figma.com/v1/files/AbC123xyz456?depth=2': {body: file}});
  assert.equal(result.exit, 0, result.output);
  assert.equal(result.output, readFileSync(new URL('./goldens/outline.txt', import.meta.url), 'utf8') + '\n');
});
test('comments ignore malformed URL node-id and return the empty golden', async () => {
  const result = await run(['comments', 'https://www.figma.com/design/AbC123xyz456/X?node-id=abc'], {[endpoint]: {body: {comments: []}}});
  assert.equal(result.exit, 0, result.output);
  assert.equal(result.output, readFileSync(new URL('./goldens/comments-empty.txt', import.meta.url), 'utf8') + '\n');
});
