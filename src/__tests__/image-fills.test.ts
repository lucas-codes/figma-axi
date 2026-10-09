import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as download from '../download.ts';
import * as design from '../design.ts';
const {parseImageUrl} = download;
const parseImageRef = (value: string) => design.parseImageRef(value);
const fetchImageFill: typeof download.fetchImageFill = (...args) => download.fetchImageFill(...args);
import {operationUrl} from '../http.ts';
import {parseFileRef} from '../ref.ts';
import {AxiError} from '../errors.ts';
import {png, jpg} from './fixtures/images.ts';
const url = parseImageUrl('https://fills.example.test/photo.svg');
const refuses = (code: string) => (error: unknown) => error instanceof AxiError && error.detail.code === code;
for (const [format, bytes] of [['png', png], ['jpg', jpg], ['gif', Buffer.from('GIF89a')], ['webp', Buffer.from('RIFF\x00\x00\x00\x00WEBP')]] as const)
  test('fill sniffs ' + format + ' independent of URL and content type', async () => {
    let request: RequestInit | undefined;
    const ref = parseImageRef(createHash('sha1').update(bytes).digest('hex'));
    const result = await fetchImageFill(url, async (_url, init) => {
      request = init;
      return new Response(new Uint8Array(bytes), {headers: {'content-type': 'text/plain'}});
    }, ref);
    assert.deepEqual(result, {format, bytes: Buffer.from(bytes)});
    assert.deepEqual(Object.fromEntries(new Headers(request?.headers)), {accept: 'image/*'});
    assert.equal(request?.redirect, 'manual');
  });
test('fill rejects SHA-1 mismatch and unknown magic bytes', async () => {
  const ref = parseImageRef('a'.repeat(40));
  await assert.rejects(fetchImageFill(url, async () => new Response(png), ref), refuses('download_failed'));
  const bytes = Buffer.from('<svg/>');
  await assert.rejects(fetchImageFill(url, async () => new Response(bytes), parseImageRef(createHash('sha1').update(bytes).digest('hex'))), refuses('download_failed'));
});
test('fill redirects and oversized bodies refused', async () => {
  const ref = parseImageRef(createHash('sha1').update(png).digest('hex'));
  await assert.rejects(fetchImageFill(url, async () => new Response(png, {status: 302}), ref), refuses('security'));
  await assert.rejects(fetchImageFill(url, async () => new Response(png, {headers: {'content-length': '52428801'}}), ref), refuses('download_failed'));
});
test('file fills endpoint and unbounded nodes URL', () => {
  const {fileKey} = parseFileRef('AbC123xyz456');
  assert.equal(operationUrl({op: 'getImageFills', fileKey}).href, 'https://api.figma.com/v1/files/AbC123xyz456/images');
});
for (const ref of ['A'.repeat(40), 'a'.repeat(39), '../photo'])
  test('image ref boundary rejects ' + ref, () => assert.throws(() => parseImageRef(ref), refuses('bad_response')));
