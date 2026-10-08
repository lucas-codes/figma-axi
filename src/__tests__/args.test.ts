import test from 'node:test';
import assert from 'node:assert/strict';
import {decode} from '@toon-format/toon';
import {run} from './harness.ts';
import {parseArgs, parseFlags} from '../args.ts';
import {DEFS} from '../registry.ts';
for (const flag of ['--bogus', '--constructor', '--toString']) test('unknown flag is rejected before fetching: ' + flag, async () => {
  const result = await run(['inspect', 'AbC123xyz456', flag]);
  assert.equal(result.exit, 2);
  assert.deepEqual(decode(result.output), {
    error: 'unknown flag: ' + flag, code: 'usage', validFlags: ['--node', '--depth', '--limit', '--full', '--json'],
    help: ['Run `figma-axi inspect --help` for flags and examples'],
  });
  assert.deepEqual(result.calls, []);
});
for (const [name, value] of [['depth', '0'], ['depth', '21'], ['depth', '1.5'], ['depth', 'NaN'], ['limit', '-1'], ['scale', '4.01'], ['format', 'pdf'], ['node', 'true']])
  test('invalid flag value ' + name + '=' + value, async () => {
    const command = name === 'scale' || name === 'format' ? 'render' : 'inspect';
    const result = await run([command, 'AbC123xyz456', '--' + name + '=' + value]);
    assert.equal(result.exit, 2);
    assert.equal((decode(result.output) as {code: string}).code, 'usage');
    assert.deepEqual(result.calls, []);
  });
test('boolean flags do not consume the command and literal -- stops flags', async () => {
  assert.equal((await run(['--help', 'inspect'])).exit, 0);
  const stopped = await run(['--', '--bogus']);
  assert.equal(stopped.exit, 2);
  assert.match(stopped.output, /Unknown command/);
});
test('equals, separate values, defaults and global JSON produce typed flags', () => {
  const args = parseArgs(['render', 'AbC123xyz456', '--node=1-2', '--scale', '0.01', '--format=jpg', '--json']);
  assert.deepEqual(parseFlags(args, DEFS.render.flags), {json: true, node: '1-2', scale: 0.01, format: 'jpg', out: '$TMPDIR/figma-axi'});
});
