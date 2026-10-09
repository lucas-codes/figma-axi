import type {Node, IsLayerTrait, Rectangle, TypePropertiesTrait, InstanceNode, Component} from '@figma/rest-api-spec';
import {AxiError} from './errors.ts';
import type {NodeId, NodeRef} from './ref.ts';
import {urlForm} from './ref.ts';
import {sanitize} from './security.ts';

export type NodeClass = 'container' | 'text' | 'instance' | 'shape' | 'leaf';
export const NODE_CLASS: Record<Node['type'], NodeClass> = {
  DOCUMENT: 'container', CANVAS: 'container', FRAME: 'container', GROUP: 'container',
  SECTION: 'container', COMPONENT: 'container', COMPONENT_SET: 'container',
  TABLE: 'container', TRANSFORM_GROUP: 'container', WIDGET: 'container',
  TEXT: 'text', INSTANCE: 'instance',
  VECTOR: 'shape', BOOLEAN_OPERATION: 'shape', ELLIPSE: 'shape',
  LINE: 'shape', STAR: 'shape', REGULAR_POLYGON: 'shape',
  RECTANGLE: 'leaf', SLICE: 'leaf', EMBED: 'leaf', LINK_UNFURL: 'leaf',
  STICKY: 'leaf', SHAPE_WITH_TEXT: 'leaf', CONNECTOR: 'leaf', WASHI_TAPE: 'leaf',
  TABLE_CELL: 'leaf', TEXT_PATH: 'leaf',
};
export type RawNode<F = null> = Pick<IsLayerTrait, 'id' | 'name' | 'visible'> & {
  id: NodeId; type: string; cls: NodeClass;
  box: Pick<Rectangle, 'width' | 'height'> | null;
  characters: TypePropertiesTrait['characters'] | null;
  componentId: InstanceNode['componentId'] | null;
  facet: F;
  children: readonly RawNode<F>[];
};
export type SummaryRow = {depth: number; id: string; type: string; name: string; size: string | null; content: string | null};
export type NodeSummary = {
  rows: SummaryRow[];
  counts: {hidden: number; shapesOmitted: number; beyondLimit: number; textsTruncated: number};
  depthCutPossible: boolean;
};
export type SummaryOptions = {
  maxDepth: number; limit: number | null; textMax: number | null;
  componentNames: ReadonlyMap<string, string>;
};
function badResponse(): never {
  throw new AxiError({code: 'bad_response'}, 'Invalid node structure response', ['Check the Figma API response']);
}
function record(raw: unknown): raw is Record<string, unknown> {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw);
}
function nodeId(id: string): id is NodeId { return /^I?\d+:\d+(;I?\d+:\d+)*$/.test(id); }
function knownType(type: string): type is Node['type'] { return Object.hasOwn(NODE_CLASS, type); }

export type FacetParser<F> = (raw: Readonly<Record<string, unknown>>, type: string) => F;
export function parseNodeTree(raw: unknown): RawNode<null>;
export function parseNodeTree<F>(raw: unknown, facet: FacetParser<F>): RawNode<F>;
export function parseNodeTree<F>(raw: unknown, facet: FacetParser<F | null> = () => null): RawNode<F | null> {
  if (!record(raw) || typeof raw.id !== 'string' ||
      typeof raw.name !== 'string' || typeof raw.type !== 'string' ||
      (raw.visible !== undefined && typeof raw.visible !== 'boolean') ||
      (raw.characters !== undefined && typeof raw.characters !== 'string') ||
      (raw.componentId !== undefined && typeof raw.componentId !== 'string') ||
      (raw.children !== undefined && !Array.isArray(raw.children))) badResponse();
  const id = sanitize(raw.id);
  if (!nodeId(id)) badResponse();
  let box: RawNode['box'] = null;
  if (raw.absoluteBoundingBox !== undefined && raw.absoluteBoundingBox !== null) {
    const b = raw.absoluteBoundingBox;
    if (!record(b) || typeof b.width !== 'number' || !Number.isFinite(b.width) ||
        typeof b.height !== 'number' || !Number.isFinite(b.height)) badResponse();
    box = {width: b.width, height: b.height};
  }
  const type = sanitize(raw.type);
  if (type === 'TEXT' && typeof raw.characters !== 'string') badResponse();
  return {
    id, name: sanitize(raw.name), type, cls: knownType(type) ? NODE_CLASS[type] : 'leaf',
    ...(raw.visible === undefined ? {} : {visible: raw.visible}), box,
    characters: typeof raw.characters === 'string' ? sanitize(raw.characters) : null,
    componentId: typeof raw.componentId === 'string' ? sanitize(raw.componentId) : null,
    facet: facet(raw, type),
    children: raw.children === undefined ? [] : raw.children.map(child => parseNodeTree(child, facet)),
  };
}

export function parseComponentNames(raw: unknown): ReadonlyMap<string, Component['name']> {
  if (!record(raw)) badResponse();
  const names = new Map<string, Component['name']>();
  for (const [id, component] of Object.entries(raw)) {
    if (!record(component) || typeof component.name !== 'string') badResponse();
    names.set(sanitize(id), sanitize(component.name));
  }
  return names;
}

export type NodesEntry = {file: string; document: unknown; entry: Readonly<Record<string, unknown>>};
export function parseNodesEntry(raw: unknown, ref: NodeRef): NodesEntry {
  if (!record(raw) || typeof raw.name !== 'string' || !record(raw.nodes))
    throw new AxiError({code: 'bad_response'}, 'Invalid file nodes response', ['Check the Figma API response']);
  if (!Object.hasOwn(raw.nodes, ref.nodeId) || raw.nodes[ref.nodeId] === null)
    throw new AxiError({code: 'node_not_found'}, 'Node ' + urlForm(ref.nodeId) + ' was not found',
      ['Run `figma-axi outline ' + ref.fileKey + '` to list frames and their ids']);
  const entry = raw.nodes[ref.nodeId];
  if (!record(entry) || !('document' in entry) || !('components' in entry))
    throw new AxiError({code: 'bad_response'}, 'Invalid requested node response', ['Check the Figma API response']);
  return {file: sanitize(raw.name), document: entry.document, entry};
}
export type Visit<F> = {node: RawNode<F>; depth: number; collapsed: boolean};
export type WalkCounts = {hidden: number; shapesOmitted: number; beyondLimit: number; instanceLayersSkipped: number};
export type Walk<F> = {root: RawNode<F>; visits: readonly Visit<F>[]; counts: WalkCounts; depthCutPossible: boolean};
export function walkLayers<F>(root: RawNode<F>, opts: {maxDepth: number; limit: number | null}): Walk<F> {
  const visits: Visit<F>[] = [];
  const counts: WalkCounts = {hidden: 0, shapesOmitted: 0, beyondLimit: 0, instanceLayersSkipped: 0};
  let depthCutPossible = false;
  function omitted(node: RawNode<F>): boolean {
    if (node.visible === false) { counts.hidden++; return true; }
    if (node.cls === 'shape') { counts.shapesOmitted++; return true; }
    return false;
  }
  function skipped(node: RawNode<F>, depth: number): void {
    if (depth > opts.maxDepth || omitted(node)) return;
    counts.instanceLayersSkipped++;
    if (node.cls === 'container' || node.cls === 'instance')
      for (const child of node.children) skipped(child, depth + 1);
  }
  function visit(node: RawNode<F>, depth: number): void {
    if (depth > opts.maxDepth || omitted(node)) return;
    const collapsed = node.cls === 'instance' && depth > 0;
    const included = opts.limit === null || visits.length < opts.limit;
    if (included) {
      visits.push({node, depth, collapsed});
      if ((node.cls === 'container' || (node.cls === 'instance' && !collapsed)) && depth === opts.maxDepth)
        depthCutPossible = true;
      if (collapsed) for (const child of node.children) skipped(child, depth + 1);
    } else counts.beyondLimit++;
    if (!collapsed && (node.cls === 'container' || node.cls === 'instance'))
      for (const child of node.children) visit(child, depth + 1);
  }
  if (root.type === 'DOCUMENT') {
    if (!omitted(root)) for (const child of root.children) visit(child, 0);
  } else visit(root, 0);
  return {root, visits, counts, depthCutPossible};
}
export function summarize(root: RawNode, opts: SummaryOptions): NodeSummary {
  const walk = walkLayers(root, opts);
  let textsTruncated = 0;
  function text(value: string): string {
    if (opts.textMax !== null) {
      const points = Array.from(value);
      if (points.length > opts.textMax) {
        textsTruncated++;
        return points.slice(0, opts.textMax).join('');
      }
    }
    return value;
  }
  function instanceTexts(node: RawNode, depth: number, parts: string[]): void {
    if (depth > opts.maxDepth || node.visible === false || node.cls === 'shape') return;
    if (node.cls === 'text') parts.push(text(node.characters ?? ''));
    else if (node.cls === 'container' || node.cls === 'instance')
      for (const child of node.children) instanceTexts(child, depth + 1, parts);
  }
  const rows = walk.visits.map(({node, depth, collapsed}) => {
    let content: string | null = null;
    if (node.cls === 'text') content = text(node.characters ?? '');
    else if (collapsed) {
      const parts: string[] = [];
      const component = node.componentId === null ? undefined : opts.componentNames.get(node.componentId);
      if (component !== undefined) parts.push(component);
      for (const child of node.children) instanceTexts(child, depth + 1, parts);
      content = parts.length ? parts.join(' | ') : null;
    }
    return {depth, id: urlForm(node.id), type: node.type, name: node.name,
      size: node.box === null ? null : Math.round(node.box.width) + 'x' + Math.round(node.box.height), content};
  });
  const {hidden, shapesOmitted, beyondLimit} = walk.counts;
  return {rows, counts: {hidden, shapesOmitted, beyondLimit, textsTruncated}, depthCutPossible: walk.depthCutPossible};
}
