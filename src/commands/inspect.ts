import type {GetFileNodesResponse} from '@figma/rest-api-spec';
import {AxiError} from '../errors.ts';
import type {Handler, InspectDef} from '../registry.ts';
import {urlForm} from '../ref.ts';
import {sanitize} from '../security.ts';
import {parseComponentNames, parseNodeTree, summarize} from '../summarize.ts';

type FileMetadata = Pick<GetFileNodesResponse, 'name'>;
export const run: Handler<InspectDef> = async ({ref, flags}, ctx) => {
  const raw = await ctx.figma({op: 'getFileNodes', fileKey: ref.fileKey, query: {ids: ref.nodeId, depth: flags.depth}});
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !('name' in raw) || typeof raw.name !== 'string' ||
      !('nodes' in raw) || !raw.nodes || typeof raw.nodes !== 'object' || Array.isArray(raw.nodes))
    throw new AxiError({code: 'bad_response'}, 'Invalid file nodes response', ['Check the Figma API response']);
  const file: FileMetadata = {name: sanitize(raw.name)};
  const id = urlForm(ref.nodeId);
  if (!(ref.nodeId in raw.nodes) || Reflect.get(raw.nodes, ref.nodeId) === null)
    throw new AxiError({code: 'node_not_found'}, 'Node ' + id + ' was not found',
      ['Run `figma-axi outline ' + ref.fileKey + '` to list frames and their ids']);
  const entry: unknown = Reflect.get(raw.nodes, ref.nodeId);
  if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !('document' in entry) || !('components' in entry))
    throw new AxiError({code: 'bad_response'}, 'Invalid requested node response', ['Check the Figma API response']);
  const document = parseNodeTree(entry.document);
  const summary = summarize(document, {
    maxDepth: flags.depth, limit: flags.full ? null : flags.limit, textMax: flags.full ? null : 200,
    componentNames: parseComponentNames(entry.components),
  });
  const help = ['Run `figma-axi render ' + ref.fileKey + ' --node ' + id + '` to see this frame'];
  const child = summary.rows.find(row => row.depth === 1 &&
    document.children.some(node => node.cls === 'container' && urlForm(node.id) === row.id));
  if (child) help.push('Run `figma-axi inspect ' + ref.fileKey + ' --node ' + child.id + '` to focus on one child');
  if (summary.depthCutPossible)
    help.push('Container nodes at depth ' + flags.depth + ' may have more layers; re-run with a larger --depth');
  if (summary.counts.beyondLimit > 0)
    help.push('Re-run with a larger --limit or --full to include omitted rows and untruncated text');
  return {file: file.name, node: id, depth: flags.depth, ...summary.counts, nodes: summary.rows, help};
};
