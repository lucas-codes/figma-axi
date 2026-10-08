import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {main} from '../index.ts';
import {run} from './harness.ts';
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
  assert.equal(result.output, readFileSync(new URL('./goldens/' + name + '.txt', import.meta.url), 'utf8') + '\n');
  const json = await run([...scenario.argv, '--json'], 'routes' in scenario ? scenario.routes : {}, 'env' in scenario ? scenario.env : undefined);
  assert.equal(json.exit, scenario.exit);
  assert.deepEqual(JSON.parse(json.output), scenario.model);
  if (name === 'home-unavailable') assert.deepEqual(result.calls, []);
});
test('home refuses malformed current-user data', async () => {
  const result = await run([], {'https://api.figma.com/v1/me': {body: {handle: 'lucas'}}});
  assert.equal(result.exit, 1);
  assert.match(result.output, /code: bad_response/);
});
