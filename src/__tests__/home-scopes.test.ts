import test from 'node:test';
import assert from 'node:assert/strict';
import {decode} from '@toon-format/toon';
import {run} from './harness.ts';
test('unavailable home names every required read scope', async () => {
  const result = await run([], {}, {});
  assert.equal(result.exit, 0);
  assert.deepEqual(decode(result.output), {
    bin: '/repo/node_modules/.bin/figma-axi',
    description: 'Read-only Figma REST for agents: frames, layer text, rendered images and comments.',
    version: '0.1.0', auth: 'unavailable',
    attention: ['FIGMA_TOKEN is not set. Create a personal access token in Figma (Settings then Security) with required file_content:read and file_comments:read scopes; current_user:read is optional to show the account. Export it'],
    help: ['Run `figma-axi --help` for setup and every command'],
  });
});
