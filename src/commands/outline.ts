import type {GetFileResponse} from '@figma/rest-api-spec';
import {AxiError} from '../errors.ts';
import type {Handler, OutlineDef} from '../registry.ts';
import {sanitize} from '../security.ts';
import {parseComponentNames, parseNodeTree, summarize} from '../summarize.ts';

type FileMetadata = Pick<GetFileResponse, 'name' | 'lastModified'>;
export const run: Handler<OutlineDef> = async ({ref, flags}, ctx) => {
  const raw = await ctx.figma({op: 'getFile', fileKey: ref.fileKey, query: {depth: 2}});
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
      !('name' in raw) || typeof raw.name !== 'string' ||
      !('lastModified' in raw) || typeof raw.lastModified !== 'string' ||
      !('document' in raw) || !('components' in raw))
    throw new AxiError({code: 'bad_response'}, 'Invalid file response', ['Check the Figma API response']);
  const file: FileMetadata = {name: sanitize(raw.name), lastModified: sanitize(raw.lastModified)};
  const document = parseNodeTree(raw.document);
  if (document.type !== 'DOCUMENT' || document.children.some(node => node.type !== 'CANVAS'))
    throw new AxiError({code: 'bad_response'}, 'Invalid file document', ['Check the Figma API response']);
  const summary = summarize(document, {maxDepth: 1, limit: flags.limit, textMax: 200,
    componentNames: parseComponentNames(raw.components)});
  const help: string[] = [];
  const firstFrame = summary.rows.find(row => row.type === 'FRAME');
  if (firstFrame) help.push("Run `figma-axi inspect " + ref.fileKey + " --node " + firstFrame.id + "` for a frame's layers and text");
  const section = summary.rows.find(row => row.type === 'SECTION');
  if (section) help.push('Run `figma-axi inspect ' + ref.fileKey + ' --node ' + section.id + ' --depth 1` to list the frames inside a SECTION');
  if (summary.counts.beyondLimit > 0)
    help.push('Re-run with a larger --limit to include omitted rows; inspect a frame with --full for all fetched layers and text');
  return {file: file.name, key: ref.fileKey, lastModified: file.lastModified,
    pages: document.children.length, ...summary.counts, nodes: summary.rows, help};
};
