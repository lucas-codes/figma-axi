import test from 'node:test';
import assert from 'node:assert/strict';
import type {ErrorResponsePayloadWithErrorBoolean} from '@figma/rest-api-spec';
import {run} from './harness.ts';

const scopeError = {
  error: true, status: 403,
  message: 'Invalid scope: ["file_content:read", "file_comments:read"]',
} satisfies ErrorResponsePayloadWithErrorBoolean;
const cases = [
  {name: 'observed scope refusal message', body: scopeError, figma: 'Invalid scope: ["file_content:read", "file_comments:read"]'},
  {name: 'err takes precedence', body: {err: 'Original refusal', message: 'Other refusal'}, figma: 'Original refusal'},
  {name: 'non-string err falls back to message', body: {err: true, message: 'Scope refused'}, figma: 'Scope refused'},
  {name: 'empty err takes precedence', body: {err: '', message: 'Other refusal'}, figma: ''},
  {name: 'non-string messages are null', body: {err: false, message: 403}, figma: null},
  {name: 'missing messages are null', body: {status: 403}, figma: null},
  {name: 'message is sanitized and bounded', body: {message: '\u001b[31m' + 'x'.repeat(201)}, figma: 'x'.repeat(200)},
  {name: 'message limit counts code points', body: {message: '😀'.repeat(201)}, figma: '😀'.repeat(200)},
];
for (const scenario of cases) test('outline refusal: ' + scenario.name, async () => {
  const result = await run(['outline', 'AbC123xyz456', '--json'], {
    'https://api.figma.com/v1/files/AbC123xyz456?depth=2': {status: 403, body: scenario.body},
  });
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {
    error: 'Figma refused the request (403)', code: 'forbidden', status: 403, figma: scenario.figma,
    help: ['Check FIGMA_TOKEN has the file_content:read scope and that its account can open this file'],
  });
});
