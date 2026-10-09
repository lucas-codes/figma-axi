import type {GetImageFillsResponse} from '@figma/rest-api-spec';
import {readFile, stat} from 'node:fs/promises';
import {join} from 'node:path';
import {collectImageFills, parseStyleFacet, type ImageRef, type ImageUse} from '../design.ts';
import {fetchImageFill, fillFormat, matchesImageRef, parseImageUrl, writeAtomic, type FillFormat} from '../download.ts';
import {AxiError} from '../errors.ts';
import {urlForm} from '../ref.ts';
import type {AssetsDef, Handler} from '../registry.ts';
import {parseNodesEntry, parseNodeTree} from '../summarize.ts';
type Saved = {format: FillFormat; bytes: number; path: string};
type ImageRow = ImageUse & ({status: 'saved' | 'cached'} & Saved | {status: 'missing'; format: null; bytes: null; path: null});
function parseImageFillUrls(raw: unknown): GetImageFillsResponse['meta']['images'] {
  const bad = () => new AxiError({code: 'bad_response'}, 'Invalid image fills response', ['Check the Figma API response']);
  if (!raw || typeof raw !== 'object' || !('meta' in raw) || !raw.meta || typeof raw.meta !== 'object' ||
      !('images' in raw.meta) || !raw.meta.images || typeof raw.meta.images !== 'object' || Array.isArray(raw.meta.images)) throw bad();
  const images: GetImageFillsResponse['meta']['images'] = Object.create(null);
  for (const [ref, url] of Object.entries(raw.meta.images)) {
    if (typeof url !== 'string') throw bad();
    images[ref] = url;
  }
  return images;
}
async function findSaved(dir: string, ref: ImageRef): Promise<Saved | null> {
  for (const format of ['png', 'jpg', 'gif', 'webp'] as const) {
    const path = join(dir, ref + '.' + format);
    let bytes: Uint8Array;
    try {
      if ((await stat(path)).size > 50 * 1024 * 1024) continue;
      bytes = await readFile(path);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') continue;
      throw new AxiError({code: 'download_failed'}, 'Could not read the cached image fill', ['Check that --out points at a readable directory']);
    }
    if (matchesImageRef(bytes, ref) && fillFormat(bytes) === format) return {format, path, bytes: bytes.byteLength};
  }
  return null;
}
export const run: Handler<AssetsDef> = async ({ref, flags}, ctx) => {
  const entry = parseNodesEntry(await ctx.figma({op: 'getFileNodes', fileKey: ref.fileKey, query: {ids: ref.nodeId}}), ref);
  const uses = collectImageFills(parseNodeTree(entry.document, parseStyleFacet));
  const urls = parseImageFillUrls(await ctx.figma({op: 'getImageFills', fileKey: ref.fileKey}));
  const out = join(flags.out, ref.fileKey, 'fills');
  const images: ImageRow[] = [];
  for (const use of uses.slice(0, flags.limit)) {
    const cached = await findSaved(out, use.imageRef);
    if (cached) {images.push({...use, status: 'cached', ...cached}); continue;}
    const url = urls[use.imageRef];
    if (url === undefined) {images.push({...use, status: 'missing', format: null, bytes: null, path: null}); continue;}
    const {bytes, format} = await fetchImageFill(parseImageUrl(url), ctx.fetch, use.imageRef);
    const path = join(out, use.imageRef + '.' + format);
    await writeAtomic(path, bytes);
    images.push({...use, status: 'saved', format, bytes: bytes.byteLength, path});
  }
  const beyondLimit = Math.max(0, uses.length - flags.limit);
  return {file: entry.file, node: urlForm(ref.nodeId), out, found: uses.length,
    saved: images.filter(i => i.status === 'saved').length,
    cached: images.filter(i => i.status === 'cached').length,
    missing: images.filter(i => i.status === 'missing').length, beyondLimit,
    images: images.map(i => ({imageRef: i.imageRef, status: i.status, format: i.format, bytes: i.bytes, layer: i.layer, uses: i.uses, path: i.path})),
    help: ['Read each image at path; files are named by imageRef, so a re-run reuses them',
      'Run `figma-axi render ' + ref.fileKey + ' --node <id> --format svg` for icons and vectors, which are not image fills',
      ...(beyondLimit ? ['Re-run with --limit ' + uses.length + ' to include all image fills'] : [])]};
};
