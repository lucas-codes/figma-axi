import test from 'node:test';
import assert from 'node:assert/strict';
import type {ErrorResponsePayloadWithErrMessage, ErrorResponsePayloadWithErrorBoolean} from '@figma/rest-api-spec';
import {run} from './harness.ts';

const cases = [
  {name: 'outline 403 invalid token uses token help', argv: ['outline', 'AbC123xyz456'], url: 'https://api.figma.com/v1/files/AbC123xyz456?depth=2', body: {status: 403, err: 'Invalid token'} satisfies ErrorResponsePayloadWithErrMessage, figma: 'Invalid token', help: 'Check FIGMA_TOKEN is a valid, unexpired personal access token'},
  {name: 'comments 403 invalid scope uses only its scope help', argv: ['comments', 'AbC123xyz456'], url: 'https://api.figma.com/v1/files/AbC123xyz456/comments?as_md=true', body: {error: true, status: 403, message: 'Invalid scope: ["file_comments:read"]'} satisfies ErrorResponsePayloadWithErrorBoolean, figma: 'Invalid scope: ["file_comments:read"]', help: 'Check FIGMA_TOKEN has the file_comments:read scope'},
  {name: 'outline 403 other message keeps status help', argv: ['outline', 'AbC123xyz456'], url: 'https://api.figma.com/v1/files/AbC123xyz456?depth=2', body: {status: 403, err: 'Account access denied'} satisfies ErrorResponsePayloadWithErrMessage, figma: 'Account access denied', help: 'Check FIGMA_TOKEN has the file_content:read scope and that its account can open this file'},
];
for (const scenario of cases) test(scenario.name, async () => {
  const result = await run([...scenario.argv, '--json'], {[scenario.url]: {status: 403, body: scenario.body}});
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {error: 'Figma refused the request (403)', code: 'forbidden', status: 403, figma: scenario.figma, help: [scenario.help]});
});
