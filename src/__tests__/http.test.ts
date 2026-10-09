import test from 'node:test';
import assert from 'node:assert/strict';
import {figmaGet, operationUrl, type Operation} from '../http.ts';
import {parseRef, requireNode} from '../ref.ts';
const env = {FIGMA_TOKEN: 'figd_DUMMY_SECRET'};
const ref = requireNode(parseRef('AbC123xyz456', '1-2'), 'inspect');
const operations: [Operation, string][] = [
  [{op: 'getMe'}, 'https://api.figma.com/v1/me'],
  [{op: 'getFile', fileKey: ref.fileKey, query: {depth: 2}}, 'https://api.figma.com/v1/files/AbC123xyz456?depth=2'],
  [{op: 'getFileNodes', fileKey: ref.fileKey, query: {ids: ref.nodeId, depth: 5}}, 'https://api.figma.com/v1/files/AbC123xyz456/nodes?ids=1%3A2&depth=5'],
  [{op: 'getImages', fileKey: ref.fileKey, query: {ids: [ref.nodeId], format: 'png', scale: 1}}, 'https://api.figma.com/v1/images/AbC123xyz456?ids=1%3A2&format=png&scale=1'],
  [{op: 'getComments', fileKey: ref.fileKey, query: {as_md: true}}, 'https://api.figma.com/v1/files/AbC123xyz456/comments?as_md=true'],
  [{op: 'getLocalVariables', fileKey: ref.fileKey}, 'https://api.figma.com/v1/files/AbC123xyz456/variables/local'],
];
for (const [op, expected] of operations) test('authenticated GET ' + op.op, async () => {
  assert.equal(operationUrl(op).href, expected);
  let received: unknown;
  const value = await figmaGet(op, {env, fetch: async (url, init) => {
    received = {url: String(url), method: init?.method, redirect: init?.redirect, headers: Object.fromEntries(new Headers(init?.headers))};
    return Response.json({result: 'ok'});
  }});
  assert.deepEqual(value, {result: 'ok'});
  assert.deepEqual(received, {url: expected, method: 'GET', redirect: 'manual', headers: {accept: 'application/json', 'x-figma-token': 'figd_DUMMY_SECRET'}});
});
for (const [status, code] of [[400, 'bad_request'], [401, 'unauthorized'], [403, 'forbidden'], [404, 'not_found'], [500, 'http_error']] as const)
  test('status ' + status + ' maps to ' + code, async () => {
    await assert.rejects(figmaGet({op: 'getMe'}, {env, fetch: async () => Response.json({err: 'Invalid token'}, {status})}),
      {message: 'Figma refused the request (' + status + ')', detail: {code, status, figma: 'Invalid token'}});
  });
test('variable endpoint refusals identify the variable read scope', async () => {
  await assert.rejects(figmaGet({op: 'getLocalVariables', fileKey: ref.fileKey}, {env, fetch: async () => Response.json({message: 'Invalid scope(s)'}, {status: 403})}), {detail: {code: 'forbidden', status: 403, figma: 'Invalid scope(s)'}, help: ['Check FIGMA_TOKEN has the file_variables:read scope']});
});
test('429 exposes bounded rate-limit headers and rejects invalid retry values', async () => {
  for (const [retry, expected] of [['42', 42], ['86401', null], ['1.5', null], ['tomorrow', null]] as const)
    await assert.rejects(figmaGet({op: 'getMe'}, {env, fetch: async () => new Response('', {status: 429, headers: {
      'Retry-After': retry, 'X-Figma-Rate-Limit-Type': 'low', 'X-Figma-Plan-Tier': 'starter',
    }})}), {detail: {code: 'rate_limited', retryAfter: expected, rateLimitType: 'low', planTier: 'starter'}});
});
for (const status of [301, 302, 307, 308]) test('redirect ' + status + ' is refused', async () =>
  assert.rejects(figmaGet({op: 'getMe'}, {env, fetch: async () => new Response('', {status, headers: {location: 'https://evil.test/'}})}), {detail: {code: 'security'}}));
test('deadline bounds even fetch implementations that ignore abort', async t => {
  t.mock.timers.enable({apis: ['setTimeout']});
  let signal: AbortSignal | null | undefined;
  const result = assert.rejects(figmaGet({op: 'getMe'}, {env, fetch: (_url, init) => {
    signal = init?.signal;
    return new Promise<Response>(() => {});
  }}), {message: 'Request deadline exceeded', detail: {code: 'transport_error'}});
  t.mock.timers.tick(60000);
  await result;
  assert.equal(signal?.aborted, true);
});
test('deadline also bounds a stalled response body', async t => {
  t.mock.timers.enable({apis: ['setTimeout']});
  const result = assert.rejects(figmaGet({op: 'getMe'}, {env, fetch: async () =>
    new Response(new ReadableStream({start() {}}), {headers: {'content-type': 'application/json'}})}), {detail: {code: 'transport_error'}});
  await Promise.resolve();
  t.mock.timers.tick(60000);
  await result;
});
test('JSON body size is capped without trusting Content-Length', async () => {
  const bytes = new Uint8Array(16 * 1024 * 1024 + 1);
  await assert.rejects(figmaGet({op: 'getMe'}, {env, fetch: async () => new Response(bytes, {headers: {'content-type': 'application/json'}})}),
    {detail: {code: 'response_too_large'}});
  await assert.rejects(figmaGet({op: 'getMe'}, {env, fetch: async () => new Response('{}', {headers: {'content-type': 'application/json', 'content-length': String(bytes.length)}})}),
    {detail: {code: 'response_too_large'}});
});
for (const [body, content] of [['hello', 'text/plain'], ['{broken', 'application/json'], ['', 'application/json']])
  test('malformed response ' + content + ' ' + body, async () =>
    assert.rejects(figmaGet({op: 'getMe'}, {env, fetch: async () => new Response(body, {headers: {'content-type': content!}})}), {detail: {code: 'bad_response'}}));
test('transport failure hides fetch diagnostics', async () =>
  assert.rejects(figmaGet({op: 'getMe'}, {env, fetch: async () => {throw new Error('figd_DUMMY_SECRET');}}),
    {message: 'Request failed', detail: {code: 'transport_error'}}));
test('missing and malformed tokens never reach fetch', async () => {
  for (const [token, code] of [[undefined, 'token_missing'], ['has space', 'security'], ['bad\nvalue', 'security']]) {
    let calls = 0;
    await assert.rejects(figmaGet({op: 'getMe'}, {env: {FIGMA_TOKEN: token}, fetch: async () => {calls++; return Response.json({});}}), {detail: {code}});
    assert.equal(calls, 0);
  }
});
