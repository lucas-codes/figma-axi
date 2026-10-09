import type {GetImagesResponse} from '@figma/rest-api-spec';
import {join} from 'node:path';
import {fetchImage, parseImageUrl, writeAtomic} from '../download.ts';
import {AxiError} from '../errors.ts';
import {urlForm, type NodeId} from '../ref.ts';
import type {Handler, RenderDef} from '../registry.ts';
import {sanitize} from '../security.ts';
type Images = Pick<GetImagesResponse, 'images'> & {err: GetImagesResponse['err'] | string};
function parseImages(raw: unknown, ids: readonly NodeId[]): Images {
  const failure = () => new AxiError({code: 'bad_response'}, 'Invalid image response', ['Check the Figma API response']);
  if (!raw || typeof raw !== 'object' || !('images' in raw) || !raw.images ||
      typeof raw.images !== 'object' || Array.isArray(raw.images)) throw failure();
  if ('err' in raw && raw.err !== null && typeof raw.err !== 'string') throw failure();
  const images: Images['images'] = {};
  for (const id of ids) {
    const image: unknown = Object.hasOwn(raw.images, id) ? Reflect.get(raw.images, id) : null;
    if (image !== null && typeof image !== 'string') throw failure();
    images[id] = image;
  }
  return {images, err: 'err' in raw && typeof raw.err === 'string' ? sanitize(raw.err).slice(0, 200) : null};
}
export const run: Handler<RenderDef> = async ({ref, flags}, ctx) => {
  const response = parseImages(await ctx.figma({op: 'getImages', fileKey: ref.fileKey,
    query: {ids: ref.nodeIds, format: flags.format, scale: flags.scale}}), ref.nodeIds);
  const failed = ref.nodeIds.filter(id => response.images[id] == null);
  if (failed.length)
    throw new AxiError({code: 'render_failed'}, 'Figma could not render node ' + failed.map(urlForm).join(', ') + (response.err ? ': ' + response.err : ''),
      ['Check the node can be rendered in Figma']);
  const images = [];
  for (const id of ref.nodeIds) {
    const bytes = await fetchImage(parseImageUrl(response.images[id]), ctx.fetch, flags.format);
    const path = join(flags.out, ref.fileKey, urlForm(id) + '@' + flags.scale + 'x.' + flags.format);
    await writeAtomic(path, bytes);
    images.push({node: urlForm(id), path, format: flags.format, bytes: bytes.byteLength});
  }
  return {images,
    help: ['Read the image at path; re-run with --scale 2 for finer detail']};
};
