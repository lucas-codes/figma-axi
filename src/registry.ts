import type { Args } from './args.ts';
import { AxiError } from './errors.ts';
import type { FigmaGet } from './http.ts';
import type { FileRef, NodeRef, RenderRef } from './ref.ts';
import { run as home } from './commands/home.ts';
import { run as outline } from './commands/outline.ts';
import { run as inspect } from './commands/inspect.ts';
import { run as render } from './commands/render.ts';
import { run as comments } from './commands/comments.ts';
import { run as assets } from './commands/assets.ts';
import { run as spec } from './commands/spec.ts';
export type CommandName = 'home' | 'outline' | 'inspect' | 'render' | 'comments' | 'spec' | 'assets';
export type FlagDef =
  | { kind: 'boolean'; description: string }
  | { kind: 'integer' | 'number'; min: number; max: number; default: number; description: string }
  | { kind: 'enum'; values: readonly [string, ...string[]]; default: string; description: string }
  | { kind: 'string'; default: string | null; description: string };
type FlagValue<D> = D extends {kind: 'boolean'} ? boolean
  : D extends {kind: 'integer' | 'number'} ? number
  : D extends {kind: 'enum'; values: readonly (infer V)[]} ? V
  : D extends {default: string} ? string : string | undefined;
export type Flags<F extends Record<string, FlagDef>> = {readonly [K in keyof F]: FlagValue<F[K]>} & {readonly json: boolean};
export interface CommandDef<F extends Record<string, FlagDef>> {
  name: CommandName; summary: string;
  positional: {name: 'url-or-key'; needsNode: boolean} | null;
  flags: F; examples: readonly [string, string, ...string[]];
}
export type Primitive = string | number | boolean | null;
export type CommandResult = Readonly<Record<string, Primitive | readonly Primitive[] | readonly Readonly<Record<string, Primitive>>[]>>;
export interface CommandContext {
  figma: FigmaGet;
  fetch: typeof globalThis.fetch;
  tmpdir: string;
  bin: string;
}
export type Handler<D extends CommandDef<Record<string, FlagDef>>> = (
  input: {ref: D['name'] extends 'render' ? RenderRef : D['positional'] extends null ? null : D['positional'] extends {needsNode: true} ? NodeRef : FileRef; flags: Flags<D['flags']>},
  ctx: CommandContext) => Promise<CommandResult>;
export const SVG_GUIDANCE = 'SVG is for icons and vectors; use `spec` for layout and `assets` for photos';
const limit = {kind: 'integer', min: 1, max: Number.MAX_SAFE_INTEGER, default: 300, description: 'max rows before omitting'} as const;
const full = {kind: 'boolean', description: 'no text truncation and no row limit'} as const;
const node = {kind: 'string', default: null, description: 'node id as 1-2 or 1:2 (from URL node-id by default)'} as const;
const depth = {kind: 'integer', min: 1, max: 20, default: 5, description: 'levels below the node to fetch (1-20)'} as const;
export const DEFS = {
  home: {name: 'home', summary: 'Current user and setup status', positional: null, flags: {}, examples: ['figma-axi', 'figma-axi --json']},
  outline: {name: 'outline', summary: 'Pages and top-level frames in a file', positional: {name: 'url-or-key', needsNode: false}, flags: {limit}, examples: ['figma-axi outline "https://www.figma.com/design/<key>/<name>"', 'figma-axi outline <key> --limit 100']},
  inspect: {name: 'inspect', summary: 'Layers and text of one node as a depth-first table', positional: {name: 'url-or-key', needsNode: true}, flags: {node, depth, limit, full}, examples: ['figma-axi inspect "https://www.figma.com/design/<key>/<name>?node-id=1-2"', 'figma-axi inspect <key> --node 1-2 --depth 8', 'figma-axi <figma-url-with-node-id>']},
  render: {name: 'render', summary: 'Render one or several nodes to local images', positional: {name: 'url-or-key', needsNode: true}, flags: {node: {...node, description: 'comma-separated node ids as 1-2 or 1:2 (from URL node-id by default)'}, format: {kind: 'enum', values: ['png', 'jpg', 'svg'], default: 'png', description: 'image format'}, scale: {kind: 'number', min: 0.01, max: 4, default: 1, description: 'image scale (0.01-4)'}, out: {kind: 'string', default: '$TMPDIR/figma-axi', description: 'output directory'}}, examples: ['figma-axi render "https://www.figma.com/design/<key>/<name>?node-id=1-2"', 'figma-axi render <key> --node 1-2,1-3 --scale 2']},
  comments: {name: 'comments', summary: 'Open designer threads pinned to a file', positional: {name: 'url-or-key', needsNode: false}, flags: {resolved: {kind: 'boolean', description: 'include resolved threads'}, limit: {...limit, default: 100}, full}, examples: ['figma-axi comments "https://www.figma.com/design/<key>/<name>"', 'figma-axi comments <key> --resolved --full']},
  assets: {name: 'assets', summary: 'Save original image fills under one node, reusing verified local files', positional: {name: 'url-or-key', needsNode: true}, flags: {node, limit, out: {kind: 'string', default: '$TMPDIR/figma-axi', description: 'output directory'}}, examples: ['figma-axi assets "https://www.figma.com/design/<key>/<name>?node-id=1-2"', 'figma-axi assets <key> --node 1-2 --limit 100']},
  spec: {name: 'spec', summary: 'Design-to-code spec of one node: layout, colours, typography, effects, tokens and component props', positional: {name: 'url-or-key', needsNode: true}, flags: {node, depth, limit}, examples: ['figma-axi spec "https://www.figma.com/design/<key>/<name>?node-id=1-2"', 'figma-axi spec <key> --node 1-2 --depth 8']},
} as const satisfies {[K in CommandName]: CommandDef<Record<string, FlagDef>>};
export type HomeDef = typeof DEFS.home;
export type OutlineDef = typeof DEFS.outline;
export type InspectDef = typeof DEFS.inspect;
export type RenderDef = typeof DEFS.render;
export type CommentsDef = typeof DEFS.comments;
export type AssetsDef = typeof DEFS.assets;
export type SpecDef = typeof DEFS.spec;
export const REGISTRY = {
  home: {def: DEFS.home, run: home}, outline: {def: DEFS.outline, run: outline},
  inspect: {def: DEFS.inspect, run: inspect}, render: {def: DEFS.render, run: render}, comments: {def: DEFS.comments, run: comments},
  spec: {def: DEFS.spec, run: spec}, assets: {def: DEFS.assets, run: assets},
} satisfies {[K in CommandName]: {def: (typeof DEFS)[K]; run: Handler<(typeof DEFS)[K]>}};
function isCommandName(command: string): command is CommandName {return Object.hasOwn(DEFS, command);}
export function route(args: Args): {name: CommandName; positional: string | undefined} {
  const command = args.command ?? 'home';
  if (/^(?:https:\/\/|figma\.com\/|www\.figma\.com\/)/.test(command)) {
    let url: URL;
    try { url = new URL(command.startsWith('https://') ? command : 'https://' + command); }
    catch { throw new AxiError({code: 'usage'}, 'Invalid Figma URL', ['Run `figma-axi --help` for examples']); }
    if (args.positional.length) throw new AxiError({code: 'usage'}, 'Unexpected positional argument', ['Run `figma-axi --help` for examples']);
    return {name: url.searchParams.has('node-id') ? 'inspect' : 'outline', positional: command};
  }
  if (!isCommandName(command))
    throw new AxiError({code: 'usage'}, 'Unknown command: ' + command, ['Run `figma-axi --help` for commands']);
  return {name: command, positional: args.positional[0]};
}
