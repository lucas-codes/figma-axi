import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {encode, decode} from '@toon-format/toon';
import {run, type Scenario} from './harness.ts';
const fixtures = new URL('./fixtures/', import.meta.url);
const scenarios: Record<string, Scenario> = {};
// Each command owns its fixture module and publishes its golden invocation there.
for (const file of readdirSync(fixtures).filter(file => file.endsWith('.ts'))) {
  const fixture = await import(new URL(file, fixtures).href);
  Object.assign(scenarios, fixture.goldenCases ?? {});
}
for (const file of readdirSync(new URL('./goldens/', import.meta.url)).filter(file => file.endsWith('.txt')))
  test('official TOON round trip and identical JSON model: ' + file, async () => {
    const scenario = scenarios[file.slice(0, -4)];
    assert.ok(scenario, 'Fixture must export goldenCases for ' + file);
    const golden = readFileSync(new URL('./goldens/' + file, import.meta.url), 'utf8');
    const json = await run([...scenario.argv, '--json'], scenario.routes, scenario.env, scenario.tmpdir);
    assert.equal(json.exit, scenario.exit);
    const model = JSON.parse(json.output);
    assert.deepEqual(decode(golden), model);
    assert.deepEqual(model, scenario.model);
    assert.equal(encode(model), golden);
  });
