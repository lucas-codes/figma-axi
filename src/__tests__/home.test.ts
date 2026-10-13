import test from 'node:test';
import assert from 'node:assert/strict';
import {main} from '../index.ts';
import {readGolden, run} from './harness.ts';
import {goldenCases} from './fixtures/me.ts';
test('home without a token explains setup and exits successfully', async () => {
  let output = '';
  const exit = await main([], {env: {}, fetch: async () => {throw new Error('unexpected fetch');}, write: s => {output += s;}, bin: '/repo/node_modules/.bin/figma-axi', tmpdir: '/tmp'});
  assert.equal(exit, 0);
  assert.match(output, /auth: unavailable/);
  assert.match(output, /FIGMA_TOKEN is not set/);
});
for (const [name, scenario] of Object.entries(goldenCases)) test('literal golden: ' + name, async () => {
  const result = await run(scenario.argv, 'routes' in scenario ? scenario.routes : {}, 'env' in scenario ? scenario.env : undefined);
  assert.equal(result.exit, scenario.exit);
  assert.equal(result.output, readGolden(name) + '\n');
  const json = await run([...scenario.argv, '--json'], 'routes' in scenario ? scenario.routes : {}, 'env' in scenario ? scenario.env : undefined);
  assert.equal(json.exit, scenario.exit);
  assert.deepEqual(JSON.parse(json.output), scenario.model);
  if (name === 'home-unavailable') assert.deepEqual(result.calls, []);
});
for (const scenario of [
  {name: '403 without a message', status: 403, body: {error: true, status: 403}, code: 'forbidden', figma: null},
  {name: '403 with another message', status: 403, body: {message: 'Account access denied'}, code: 'forbidden', figma: 'Account access denied'},
  {name: '403 with a non-prefix scope mention', status: 403, body: {message: 'Denied: Invalid scope'}, code: 'forbidden', figma: 'Denied: Invalid scope'},
  {name: '401 mentioning scope', status: 401, body: {message: 'Invalid scope'}, code: 'unauthorized', figma: 'Invalid scope'},
]) test('home still refuses ' + scenario.name, async () => {
  const result = await run(['--json'], {'https://api.figma.com/v1/me': {status: scenario.status, body: scenario.body}});
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {
    error: 'Figma refused the request (' + scenario.status + ')', code: scenario.code,
    status: scenario.status, figma: scenario.figma,
    help: ['Check FIGMA_TOKEN has the current_user:read scope'],
  });
});
test('home refuses malformed current-user data', async () => {
  const result = await run([], {'https://api.figma.com/v1/me': {body: {handle: 'lucas'}}});
  assert.equal(result.exit, 1);
  assert.match(result.output, /code: bad_response/);
});
