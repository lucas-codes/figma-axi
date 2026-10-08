import { AxiError } from './errors.ts';
import type { CommandName } from './registry.ts';
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };
export type FileKey = Brand<string, 'FileKey'>;
export type NodeId = Brand<string, 'NodeId'>;
export type FileRef = { readonly kind: 'file'; readonly fileKey: FileKey };
export type NodeRef = { readonly kind: 'node'; readonly fileKey: FileKey; readonly nodeId: NodeId };
export type FigmaRef = FileRef | NodeRef;
function isFileKey(value: string): value is FileKey { return /^[A-Za-z0-9]{1,128}$/.test(value); }
function isNodeId(value: string): value is NodeId { return /^I?\d+:\d+(;I?\d+:\d+)*$/.test(value); }
export function parseRef(input: string, nodeFlag: string | undefined): FigmaRef {
  let key = input;
  let node = nodeFlag;
  const fail = () => new AxiError({code: 'usage'}, 'Invalid Figma reference', ['Use a figma.com design, file, proto or board URL, or a file key']);
  if (!isFileKey(input)) {
    let url: URL;
    try { url = new URL(/^(?:www\.)?figma\.com\//.test(input) ? 'https://' + input : input); }
    catch { throw fail(); }
    if (input !== input.trim() || /[\x00-\x20\x7f-\x9f]/.test(input) || url.protocol !== 'https:' ||
        !['figma.com', 'www.figma.com'].includes(url.hostname) || url.username || url.password || url.port || url.hash) throw fail();
    const parts = url.pathname.split('/');
    if (!['design', 'file', 'proto', 'board'].includes(parts[1] ?? '')) throw fail();
    key = parts[1] === 'design' && parts[3] === 'branch' ? parts[4] ?? '' : parts[2] ?? '';
    node ??= url.searchParams.get('node-id') ?? undefined;
  }
  if (!isFileKey(key)) throw fail();
  if (node === undefined) return {kind: 'file', fileKey: key};
  const apiNode = node.replace(/-/g, ':');
  if (!isNodeId(apiNode)) throw new AxiError({code: 'usage'}, 'Invalid node id', ['Use a node id as 1-2 or 1:2']);
  return {kind: 'node', fileKey: key, nodeId: apiNode};
}
export function requireNode(ref: FigmaRef, command: CommandName): NodeRef {
  if (ref.kind === 'node') return ref;
  throw new AxiError({code: 'usage'}, command + ' needs a node and the URL has no node-id', [
    'Run `figma-axi outline ' + ref.fileKey + '` to list frames and their ids',
    'Run `figma-axi ' + command + ' ' + ref.fileKey + ' --node <id>`',
  ]);
}
export function urlForm(id: NodeId): string { return id.replace(/:/g, '-'); }
