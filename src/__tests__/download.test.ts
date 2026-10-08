import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {parseImageUrl, fetchImage, writeAtomic} from '../download.ts';
import {AxiError} from '../errors.ts';
import {png, jpg, svg} from './fixtures/images.ts';
const refuses = (code: string) => (error: unknown) => error instanceof AxiError && error.detail.code === code;
for (const raw of [null, 1, '', '/image', 'http://images.example.test/a', 'https://@images.example.test/a', 'https://:@images.example.test/a', 'https://user@images.example.test/a', 'https://user:pass@images.example.test/a', 'https://images.example.test:444/a', 'https://images.example.test/a#part', 'https://images.example.test/a#', ' https://images.example.test/a', 'https://images.example.test/\na'])
  test('image URL refusal: ' + JSON.stringify(raw), () => assert.throws(() => parseImageUrl(raw), refuses('security')));
test('HTTPS URL with default port and query is accepted', () => {
  assert.equal(parseImageUrl('https://images.example.test:443/a?signature=abc').href, 'https://images.example.test/a?signature=abc');
});
for (const [format, bytes, accept] of [['png', png, 'image/png'], ['jpg', jpg, 'image/jpeg'], ['svg', svg, 'image/svg+xml']] as const)
  test('valid ' + format + ' bytes and only Accept header even on API host', async () => {
    let request: RequestInit | undefined;
    const fetch: typeof globalThis.fetch = async (_url, init) => {
      request = init;
      return new Response(new Uint8Array(bytes));
    };
    assert.deepEqual(await fetchImage(parseImageUrl('https://api.figma.com/a'), fetch, format), Buffer.from(bytes));
    assert.deepEqual(Object.fromEntries(new Headers(request?.headers)), {accept});
    assert.equal(request?.redirect, 'manual');
  });
for (const status of [301, 302, 303, 307, 308, 400, 403, 404, 500])
  test('download status refusal: ' + status, async () => {
    const fetch: typeof globalThis.fetch = async () => new Response(png, {status});
    await assert.rejects(fetchImage(parseImageUrl('https://images.example.test/a'), fetch, 'png'), refuses(status < 400 ? 'security' : 'download_failed'));
  });
for (const [format, bytes] of [['png', jpg], ['png', png.subarray(0, 7)], ['jpg', png], ['jpg', jpg.subarray(0, 2)], ['svg', Buffer.from('<html/>')], ['svg', Buffer.from('')]] as const)
  test('magic-byte mismatch: ' + format + ' ' + bytes.length, async () => {
    const fetch: typeof globalThis.fetch = async () => new Response(new Uint8Array(bytes));
    await assert.rejects(fetchImage(parseImageUrl('https://images.example.test/a'), fetch, format), refuses('download_failed'));
  });
test('SVG starting with svg after whitespace is accepted', async () => {
  const bytes = Buffer.from(' \n\t<svg/>');
  const fetch: typeof globalThis.fetch = async () => new Response(bytes);
  assert.deepEqual(await fetchImage(parseImageUrl('https://images.example.test/a'), fetch, 'svg'), bytes);
});
test('advertised body over 50 MiB is refused', async () => {
  const fetch: typeof globalThis.fetch = async () => new Response(png, {headers: {'content-length': String(50 * 1024 * 1024 + 1)}});
  await assert.rejects(fetchImage(parseImageUrl('https://images.example.test/a'), fetch, 'png'), refuses('download_failed'));
});
for (const length of [undefined, '8'])
  test('streaming body over 50 MiB is refused despite absent or lying length: ' + length, async () => {
    let cancelled = false;
    const fetch: typeof globalThis.fetch = async () => new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(png);
        controller.enqueue(new Uint8Array(50 * 1024 * 1024));
      },
      cancel() { cancelled = true; },
    }), {headers: length ? {'content-length': length} : {}});
    await assert.rejects(fetchImage(parseImageUrl('https://images.example.test/a'), fetch, 'png'), refuses('download_failed'));
    assert.equal(cancelled, true);
  });
test('exactly 50 MiB is accepted', async () => {
  const bytes = new Uint8Array(50 * 1024 * 1024);
  bytes.set(png);
  const fetch: typeof globalThis.fetch = async () => new Response(bytes, {headers: {'content-length': String(bytes.length)}});
  const downloaded = await fetchImage(parseImageUrl('https://images.example.test/a'), fetch, 'png');
  assert.equal(downloaded.byteLength, 50 * 1024 * 1024);
  assert.equal(Buffer.compare(downloaded, bytes), 0);
});
test('network and stream failures give download_failed without reflecting errors', async () => {
  for (const fetch of [
    async () => { throw new Error('figd_DUMMY_SECRET'); },
    async () => new Response(new ReadableStream({start(c) { c.error(new Error('figd_DUMMY_SECRET')); }})),
  ]) {
    await assert.rejects(fetchImage(parseImageUrl('https://images.example.test/a'), fetch, 'png'), error => {
      assert.ok(error instanceof AxiError);
      assert.equal(error.detail.code, 'download_failed');
      assert.equal(error.message.includes('figd_DUMMY_SECRET'), false);
      return true;
    });
  }
});
test('atomic write creates parents and replaces bytes without leftover temporary files', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'download-test-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const path = join(dir, 'nested/frame.png');
  await writeAtomic(path, png);
  assert.deepEqual(await readFile(path), png);
  await writeAtomic(path, jpg);
  assert.deepEqual(await readFile(path), Buffer.from(jpg));
  assert.deepEqual(await readdir(join(dir, 'nested')), ['frame.png']);
});
test('atomic rename failure keeps existing destination and removes temporary file', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'download-test-'));
  t.after(() => rm(dir, {recursive: true, force: true}));
  const path = join(dir, 'nested');
  const {mkdir} = await import('node:fs/promises');
  await mkdir(path);
  await assert.rejects(writeAtomic(path, png), refuses('download_failed'));
  assert.deepEqual(await readdir(dir), ['nested']);
  assert.deepEqual(await readdir(path), []);
});
