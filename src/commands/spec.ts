import {AxiError} from '../errors.ts';
import {parseStyleFacet, parseCatalog, boundVariables, parseVariableNames, buildSpec, type Naming} from '../design.ts';
import {parseNodesEntry, parseNodeTree, walkLayers} from '../summarize.ts';
import {urlForm, type FileKey} from '../ref.ts';
import type {Handler, SpecDef, CommandContext} from '../registry.ts';
export const run: Handler<SpecDef> = async ({ref, flags}, ctx) => {
  const nodes = parseNodesEntry(await ctx.figma({op: 'getFileNodes', fileKey: ref.fileKey, query: {ids: ref.nodeId, depth: flags.depth}}), ref);
  const walk = walkLayers(parseNodeTree(nodes.document, parseStyleFacet), {maxDepth: flags.depth, limit: flags.limit});
  const refs = boundVariables(walk);
  const naming: Naming = refs.length ? await loadNaming(ctx, ref.fileKey) : {status: 'none-bound'};
  const spec = buildSpec(walk, parseCatalog(nodes.entry), naming);
  const attention: string[] = [];
  let variableNames: Naming['status'] | 'partial' = naming.status;
  switch (naming.status) {
    case 'resolved': {
      const unmatched = refs.filter(ref => naming.lookup(ref) === null).length;
      if (unmatched) {
        variableNames = 'partial';
        attention.push(unmatched + ' referenced variable' + (unmatched === 1 ? ' has' : 's have') + ' no matching name; unmatched labels are var.<key prefix>');
      }
      break;
    }
    case 'unavailable': attention.push('Variable names are unavailable (Figma 403' + (naming.figma === null ? '' : ': ' + naming.figma) + '). They need a token with the file_variables:read scope on an Enterprise org; until then labels are var.<key prefix> and the value column is what the design resolves to'); break;
    case 'none-bound': break;
    default: {const exhaustive: never = naming; return exhaustive;}
  }
  const id = urlForm(ref.nodeId);
  const help: string[] = [];
  if (spec.imageFills) help.push('Run `figma-axi assets ' + ref.fileKey + ' --node ' + id + '` to save ' + spec.imageFills + ' image fill' + (spec.imageFills === 1 ? '' : 's'));
  const instance = walk.visits.find(visit => visit.collapsed);
  if (instance) help.push('Run `figma-axi spec ' + ref.fileKey + ' --node ' + urlForm(instance.node.id) + '` for the layers inside an instance');
  help.push('Run `figma-axi render ' + ref.fileKey + ' --node ' + id + '` to see this ' + (walk.visits[0]?.node.cls === 'instance' ? 'instance' : 'frame'));
  if (walk.depthCutPossible) help.push('Container nodes at depth ' + flags.depth + ' may have more layers; re-run with a larger --depth');
  if (walk.counts.beyondLimit) help.push('Re-run with a larger --limit to include omitted rows, or use --node to focus on one child');
  return {file: nodes.file, node: id, depth: flags.depth, variableNames, ...walk.counts, ...spec, ...(attention.length ? {attention} : {}), help};
};
async function loadNaming(ctx: CommandContext, fileKey: FileKey): Promise<Naming> {
  let raw: unknown;
  try {raw = await ctx.figma({op: 'getLocalVariables', fileKey});}
  catch (error) {
    if (error instanceof AxiError && error.detail.code === 'forbidden') return {status: 'unavailable', figma: error.detail.figma};
    throw error;
  }
  return parseVariableNames(raw);
}
