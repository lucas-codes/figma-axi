import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {encode, decode} from '@toon-format/toon';
import {figmaGet, type Operation} from '../http.ts';
import {parseRef, requireNode} from '../ref.ts';
import {sanitize, redact, assertNoSecret} from '../security.ts';
import {run, env} from './harness.ts';
const token = 'figd_DUMMY_SECRET';
const ref = requireNode(parseRef('AbC123xyz456', '1-2'), 'inspect');
for (const [op, body] of [
  [{op: 'getMe'}, {handle: token, email: 'lucas@example.com'}],
  [{op: 'getFile', fileKey: ref.fileKey, query: {depth: 2}}, {document: {name: token}}],
  [{op: 'getFileNodes', fileKey: ref.fileKey, query: {depth: 5, ids: ref.nodeId}}, {nodes: {'1:2': {document: {name: token}}}}],
  [{op: 'getImages', fileKey: ref.fileKey, query: {ids: [ref.nodeId], format: 'png', scale: 1}}, {images: {'1:2': 'https://images.test/img?token=' + token}}],
  [{op: 'getComments', fileKey: ref.fileKey, query: {as_md: true}}, {comments: [{message: token}]}],
] satisfies [Operation, unknown][]) test('authenticated boundary refuses echoed tokens for ' + op.op, async () => {
  await assert.rejects(figmaGet(op, {env, fetch: async () => Response.json(body)}), {detail: {code: 'security'}});
});
for (const json of [false, true]) test('home refuses secret echo on stdout, including error and header fields; json=' + json, async () => {
  for (const reply of [
    {body: {handle: token, email: 'lucas@example.com'}},
    {body: {err: token}, status: 403},
    {body: {}, status: 429, headers: {'X-Figma-Plan-Tier': token}},
  ]) {
    const result = await run(json ? ['--json'] : [], {'https://api.figma.com/v1/me': reply});
    assert.equal(result.exit, 1);
    assert.equal(result.output.includes(token), false);
    assert.equal((json ? JSON.parse(result.output) : decode(result.output)).code, 'security');
  }
});
test('unknown-flag diagnostics for outline, inspect, render and comments do not echo a token', async () => {
  for (const command of ['outline', 'inspect', 'render', 'comments']) {
    const argv = [command, 'AbC123xyz456', ...(['inspect', 'render'].includes(command) ? ['--node', '1-2'] : [])];
    const result = await run([...argv, '--bogus']);
    assert.equal(result.exit, 2);
    assert.match(result.output, /code: usage/);
    assert.match(result.output, /validFlags\[/);
    assert.equal(result.output.includes(token), false);
  }
});
test('final output scan refuses a token introduced by argv or sanitization', async () => {
  const argv = await run(['--' + token]);
  assert.equal(argv.exit, 1);
  assert.match(argv.output, /code: security/);
  const split = await run([], {'https://api.figma.com/v1/me': {body: {handle: 'figd_\u001b[31mDUMMY_SECRET', email: 'lucas@example.com'}}});
  assert.equal(split.exit, 1);
  assert.match(split.output, /code: security/);
});
test('sanitization strips terminal controls and redaction is exact', () => {
  assert.equal(sanitize('\u001b[31mRed\u001b[0m\u001b]0;title\u0007\u0000\nTab\tend'), 'Red Tab end');
  assert.equal(redact('prefix ' + token + ' suffix', [token]), 'prefix [redacted] suffix');
  assert.throws(() => assertNoSecret(token, [token]), {detail: {code: 'security'}});
});
test('escaped secrets cannot bypass the serialized-output scan', () => {
  for (const secret of ['figd_"DUMMY_SECRET', 'figd_\\DUMMY_SECRET'])
    assert.throws(() => assertNoSecret(JSON.stringify({value: secret}), [secret]), {detail: {code: 'security'}});
});
test('output cap applies to serialized models', async () => {
  const result = await run([], {'https://api.figma.com/v1/me': {body: {handle: 'x'.repeat(512 * 1024), email: 'lucas@example.com'}}});
  assert.equal(result.exit, 1);
  assert.match(result.output, /code: output_too_large/);
});
test('launcher failures match official TOON and main JSON formatting without secrets or stderr', () => {
  const model = {error: 'Unable to load local build', code: 'transport_error'};
  for (const json of [false, true]) {
    const result = spawnSync(process.execPath, ['--import', './src/__tests__/reject-build.ts', 'bin/figma-axi', ...(json ? ['--json'] : [])], {encoding: 'utf8', env: {FIGMA_TOKEN: 'DUMMY_SECRET'}});
    assert.equal(result.status, 1);
    assert.equal(result.stderr, '');
    assert.equal(result.stdout, (json ? JSON.stringify(model, null, 2) : encode(model)) + '\n');
    assert.deepEqual(json ? JSON.parse(result.stdout) : decode(result.stdout), model);
  }
});
