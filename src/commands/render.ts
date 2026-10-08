import type {GetImagesResponse} from '@figma/rest-api-spec';
import {join} from 'node:path';
import {fetchImage, parseImageUrl, writeAtomic} from '../download.ts';
import {AxiError} from '../errors.ts';
import {urlForm, type NodeId} from '../ref.ts';
import type {Handler, RenderDef} from '../registry.ts';
import {sanitize} from '../security.ts';
type Images = Pick<GetImagesResponse, 'images'> & {err: GetImagesResponse['err'] | string};
function parseImages(raw: unknown, id: NodeId): Images {
  const failure = () => new AxiError({code: 'bad_response'}, 'Invalid image response', ['Check the Figma API response']);
  if (!raw || typeof raw !== 'object' || !('images' in raw) || !raw.images ||
      typeof raw.images !== 'object' || Array.isArray(raw.images)) throw failure();
  if ('err' in raw && raw.err !== null && typeof raw.err !== 'string') throw failure();
  const image: unknown = Object.hasOwn(raw.images, id) ? Reflect.get(raw.images, id) : null;
  if (image !== null && typeof image !== 'string') throw failure();
  return {images: {[id]: image}, err: 'err' in raw && typeof raw.err === 'string' ? sanitize(raw.err).slice(0, 200) : null};
}
export const run: Handler<RenderDef> = async ({ref, flags}, ctx) => {
  const response = parseImages(await ctx.figma({op: 'getImages', fileKey: ref.fileKey,
    query: {ids: ref.nodeId, format: flags.format, scale: flags.scale}}), ref.nodeId);
  const image = response.images[ref.nodeId];
  if (image === null || image === undefined)
    throw new AxiError({code: 'render_failed'}, 'Figma could not render node ' + urlForm(ref.nodeId) + (response.err ? ': ' + response.err : ''),
      ['Check the node can be rendered in Figma']);
  const bytes = await fetchImage(parseImageUrl(image), ctx.fetch, flags.format);
  const path = join(flags.out, ref.fileKey, urlForm(ref.nodeId) + '@' + flags.scale + 'x.' + flags.format);
  await writeAtomic(path, bytes);
  return {path, format: flags.format, scale: flags.scale, bytes: bytes.byteLength,
    help: ['Read the image at path; re-run with --scale 2 for finer detail']};
};
