import test from 'node:test';
import assert from 'node:assert/strict';
import {run} from './harness.ts';

const cases = [
  {name: 'comments 403', argv: ['comments', 'AbC123xyz456'], url: 'https://api.figma.com/v1/files/AbC123xyz456/comments?as_md=true', status: 403, code: 'forbidden', help: 'Check FIGMA_TOKEN has the file_comments:read scope and that its account can open this file'},
  {name: 'home 403', argv: [], url: 'https://api.figma.com/v1/me', status: 403, code: 'forbidden', help: 'Check FIGMA_TOKEN has the current_user:read scope'},
  {name: 'outline 403', argv: ['outline', 'AbC123xyz456'], url: 'https://api.figma.com/v1/files/AbC123xyz456?depth=2', status: 403, code: 'forbidden', help: 'Check FIGMA_TOKEN has the file_content:read scope and that its account can open this file'},
  {name: 'inspect 403', argv: ['inspect', 'AbC123xyz456', '--node', '1-2'], url: 'https://api.figma.com/v1/files/AbC123xyz456/nodes?ids=1%3A2&depth=5', status: 403, code: 'forbidden', help: 'Check FIGMA_TOKEN has the file_content:read scope and that its account can open this file'},
  {name: 'render 403', argv: ['render', 'AbC123xyz456', '--node', '1-2'], url: 'https://api.figma.com/v1/images/AbC123xyz456?ids=1%3A2&format=png&scale=1', status: 403, code: 'forbidden', help: 'Check FIGMA_TOKEN has the file_content:read scope and that its account can open this file'},
  {name: 'outline 401', argv: ['outline', 'AbC123xyz456'], url: 'https://api.figma.com/v1/files/AbC123xyz456?depth=2', status: 401, code: 'unauthorized', help: 'Check FIGMA_TOKEN is a valid, unexpired personal access token'},
  {name: 'outline 404', argv: ['outline', 'AbC123xyz456'], url: 'https://api.figma.com/v1/files/AbC123xyz456?depth=2', status: 404, code: 'not_found', help: "Check the file key in the URL; the token's account may not be able to see this file"},
  {name: 'outline 400', argv: ['outline', 'AbC123xyz456'], url: 'https://api.figma.com/v1/files/AbC123xyz456?depth=2', status: 400, code: 'bad_request', help: 'Check the URL, node id and flags'},
  {name: 'outline 503', argv: ['outline', 'AbC123xyz456'], url: 'https://api.figma.com/v1/files/AbC123xyz456?depth=2', status: 503, code: 'http_error', help: 'Figma returned HTTP 503; retry later'},
];
for (const scenario of cases) test('refusal help: ' + scenario.name, async () => {
  const result = await run([...scenario.argv, '--json'], {[scenario.url]: {body: {err: 'Request denied'}, status: scenario.status}});
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {
    error: 'Figma refused the request (' + scenario.status + ')', code: scenario.code,
    status: scenario.status, figma: 'Request denied', help: [scenario.help],
  });
});
