import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchImage, parseImageUrl} from '../download.ts';
for (const phase of ['headers', 'body'] as const) test('image deadline aborts stalled ' + phase + ' after 60 seconds', async t => {
  t.mock.timers.enable({apis: ['setTimeout']});
  let signal: AbortSignal | null | undefined;
  let release: (() => void) | undefined;
  let start: () => void = () => {};
  const started = new Promise<void>(resolve => { start = resolve; });
  const fetch: typeof globalThis.fetch = async (_url, init) => {
    signal = init?.signal;
    start();
    if (phase === 'headers') return new Promise<Response>(resolve => { release = () => resolve(new Response('bad')); });
    return new Response(new ReadableStream({start(controller) { release = () => controller.close(); }}));
  };
  const work = fetchImage(parseImageUrl('https://images.example.test/a'), fetch, 'png');
  const observed = work.then(() => 'success', error => ({error: error.message, code: error.detail.code, help: error.help}));
  await started;
  await Promise.resolve();
  t.mock.timers.tick(59999);
  assert.equal(signal?.aborted ?? false, false);
  t.mock.timers.tick(1);
  // Release the mock even on the unfixed code, so the red run cannot hang.
  release?.();
  assert.deepEqual(await observed, {error: 'Image download deadline exceeded', code: 'download_failed',
    help: ['Re-run the command to request a fresh image']});
  assert.equal(signal?.aborted, true);
});
