import type {GetImagesQueryParams} from '@figma/rest-api-spec';
import {randomUUID} from 'node:crypto';
import {mkdir, writeFile, rename, rm} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {AxiError} from './errors.ts';
import type {Brand} from './ref.ts';
type ImageFormat = Exclude<NonNullable<GetImagesQueryParams['format']>, 'pdf'>;
export type ImageUrl = Brand<URL, 'ImageUrl'>;
function isImageUrl(url: URL): url is ImageUrl {
  return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash;
}
export function parseImageUrl(raw: unknown): ImageUrl {
  const failure = () => new AxiError({code: 'security'}, 'Unsafe image URL', ['Use an HTTPS image URL without credentials, a custom port or a fragment']);
  if (typeof raw !== 'string' || raw !== raw.trim() || /[\x00-\x20\x7f-\x9f#]/.test(raw) ||
      /^https:[/\\]*[^/\\?#]*@/i.test(raw)) throw failure();
  let url: URL;
  try { url = new URL(raw); }
  catch { throw failure(); }
  if (!isImageUrl(url)) throw failure();
  return url;
}
const CAP = 50 * 1024 * 1024;
const ACCEPT: Record<ImageFormat, string> = {png: 'image/png', jpg: 'image/jpeg', svg: 'image/svg+xml'};
function downloadFailure(message: string): AxiError {
  return new AxiError({code: 'download_failed'}, message, ['Re-run render to request a fresh image']);
}
function matchesFormat(bytes: Uint8Array, format: ImageFormat): boolean {
  switch (format) {
    case 'png': return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => bytes[i] === byte);
    case 'jpg': return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case 'svg': return /^(?:<svg|<\?xml)/.test(new TextDecoder().decode(bytes).trimStart());
    default: { const exhaustive: never = format; return exhaustive; }
  }
}
export async function fetchImage(url: ImageUrl, fetch: typeof globalThis.fetch, format: ImageFormat): Promise<Uint8Array> {
  try {
    const response = await fetch(url.href, {headers: {Accept: ACCEPT[format]}, redirect: 'manual'});
    if (response.status >= 300 && response.status < 400)
      throw new AxiError({code: 'security'}, 'Image redirect refused', ['Re-run render to request a direct image URL']);
    if (!response.ok) throw downloadFailure('Image download failed (' + response.status + ')');
    if (Number(response.headers.get('content-length')) > CAP) {
      await response.body?.cancel();
      throw downloadFailure('Image exceeds 50 MiB');
    }
    const chunks: Uint8Array[] = [];
    const reader = response.body?.getReader();
    let size = 0;
    if (reader) {
      try {
        while (true) {
          const {done, value} = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > CAP) {
            await reader.cancel();
            throw downloadFailure('Image exceeds 50 MiB');
          }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
    }
    const bytes = Buffer.concat(chunks, size);
    if (!matchesFormat(bytes, format)) throw downloadFailure('Image bytes do not match the requested format');
    return bytes;
  } catch (error) {
    if (error instanceof AxiError) throw error;
    throw downloadFailure('Image download failed');
  }
}
export async function writeAtomic(path: string, bytes: Uint8Array): Promise<void> {
  const dir = dirname(path);
  const temporary = join(dir, '.render-' + randomUUID() + '.tmp');
  try {
    await mkdir(dir, {recursive: true});
    try {
      await writeFile(temporary, bytes, {flag: 'wx'});
      await rename(temporary, path);
    } finally { await rm(temporary, {force: true}); }
  } catch {
    throw downloadFailure('Could not write the rendered image');
  }
}
