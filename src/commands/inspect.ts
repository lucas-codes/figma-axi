import type {Handler, InspectDef} from '../registry.ts';
import {urlForm} from '../ref.ts';
import {parseComponentNames, parseNodesEntry, parseNodeTree, summarize} from '../summarize.ts';
export const run: Handler<InspectDef> = async ({ref, flags}, ctx) => {
  const raw = await ctx.figma({op: 'getFileNodes', fileKey: ref.fileKey, query: {ids: ref.nodeId, depth: flags.depth}});
  const {file, document: node, entry} = parseNodesEntry(raw, ref);
  const id = urlForm(ref.nodeId);
  const document = parseNodeTree(node);
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
  return {file, node: id, depth: flags.depth, ...summary.counts, nodes: summary.rows, help};
};
