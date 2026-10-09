import test from 'node:test';
import assert from 'node:assert/strict';
import {decode} from '@toon-format/toon';
import {run} from './harness.ts';
for (const [command, expectedFlags] of [
  ['home', ['--json']],
  ['outline', ['--limit', '--json']],
  ['inspect', ['--node', '--depth', '--limit', '--full', '--json']],
  ['render', ['--node', '--format', '--scale', '--out', '--json']],
  ['comments', ['--resolved', '--limit', '--full', '--json']],
  ['assets', ['--node', '--limit', '--out', '--json']],
  ['spec', ['--node', '--depth', '--limit', '--json']],
] as const) test(command + ' help works without credentials or requests', async () => {
  const result = await run([command, '--help'], {}, {});
  assert.equal(result.exit, 0);
  const model = decode(result.output) as {command: string; flags: {flag: string}[]; examples: string[]};
  assert.equal(model.command, 'figma-axi ' + command);
  assert.deepEqual(model.flags.map(row => row.flag), expectedFlags);
  assert.match(model.examples[0]!, /^figma-axi/);
  assert.deepEqual(result.calls, []);
});
test('root help describes commands, setup and version', async () => {
  const help = await run(['--help'], {}, {});
  assert.equal(help.exit, 0);
  assert.match(help.output, /--json/);
  assert.match(help.output, /examples\[/);
  assert.match(help.output, /FIGMA_TOKEN/);
  const model = decode(help.output) as {commands: {command: string}[]};
  assert.deepEqual(model.commands.map(row => row.command), ['home', 'outline', 'inspect', 'render', 'comments', 'assets', 'spec']);
  const version = await run(['-v'], {}, {});
  assert.equal(version.exit, 0);
  assert.equal(version.output, 'version: 0.1.0\n');
});
