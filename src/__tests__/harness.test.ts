import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {REGISTRY} from '../registry.ts';
import {run, type Scenario} from './harness.ts';

test('harness delivers literal binary bytes and content type through main', async () => {
  const original = REGISTRY.render.run;
  REGISTRY.render.run = async (_input, ctx) => {
    const response = await ctx.fetch('https://images.test/frame.png');
    return {bytes: [...new Uint8Array(await response.arrayBuffer())], contentType: response.headers.get('content-type')};
  };
  try {
    const result = await run(['render', 'AbC123xyz456', '--node', '1-2', '--json'], {
      'https://images.test/frame.png': {bytes: new Uint8Array([137, 80, 78, 71, 0, 255]), contentType: 'image/png'},
    });
    assert.equal(result.exit, 0);
    assert.deepEqual(JSON.parse(result.output), {bytes: [137, 80, 78, 71, 0, 255], contentType: 'image/png'});
  } finally {
    REGISTRY.render.run = original;
  }
});

test('scenario tmpdir reaches command context and default render output directory', async () => {
  const tmpdir = await mkdtemp('/tmp/figma-axi-harness-');
  const original = REGISTRY.render.run;
  REGISTRY.render.run = async (input, ctx) => ({tmpdir: ctx.tmpdir, out: input.flags.out});
  try {
    const scenario: Scenario = {
      argv: ['render', 'AbC123xyz456', '--node', '1-2', '--json'],
      tmpdir, exit: 0, model: {tmpdir, out: join(tmpdir, 'figma-axi')},
    };
    const result = await run(scenario.argv, scenario.routes, scenario.env, scenario.tmpdir);
    assert.equal(result.exit, scenario.exit);
    assert.deepEqual(JSON.parse(result.output), scenario.model);
    const fallback = await run(scenario.argv);
    assert.equal(fallback.exit, 0);
    assert.deepEqual(JSON.parse(fallback.output), {tmpdir: '/tmp', out: '/tmp/figma-axi'});
  } finally {
    REGISTRY.render.run = original;
    await rm(tmpdir, {recursive: true, force: true});
  }
});
