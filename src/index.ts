import {encode} from '@toon-format/toon';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {parseArgs, assertKnownFlags, parseFlags} from './args.ts';
import {AxiError, EXIT, errorModel} from './errors.ts';
import {VERSION, helpText, commandHelp} from './help.ts';
import {figmaGet} from './http.ts';
import {REGISTRY, route, type CommandContext, type CommandResult} from './registry.ts';
import {parseRef, requireNode} from './ref.ts';
import {assertNoSecret, sanitize, type Env} from './security.ts';
export interface Runtime {
  env: Env;
  fetch: typeof globalThis.fetch;
  write: (value: string) => void;
  bin?: string;
  tmpdir?: string;
}
const defaultRuntime: Runtime = {env: process.env, fetch: globalThis.fetch, write: value => {process.stdout.write(value);}};
export async function main(argv: string[], runtime: Runtime = defaultRuntime): Promise<number> {
  let json = argv.includes('--json');
  let exit = 0;
  let output = '';
  const hidden = runtime.env.FIGMA_TOKEN ? [runtime.env.FIGMA_TOKEN] : [];
  const serialize = (model: unknown) => json ? JSON.stringify(model, null, 2) : encode(model);
  const guard = (value: string) => {
    assertNoSecret(value, hidden);
    if (Buffer.byteLength(value) > 512 * 1024) throw new AxiError({code: 'output_too_large'}, 'Output exceeds 512 KiB', ['Lower --limit or omit --full']);
  };
  try {
    const args = parseArgs(argv);
    json = args.flags.has('json');
    const routed = route(args);
    const def = REGISTRY[routed.name].def;
    assertKnownFlags(args, def.flags, routed.name);
    parseFlags(args, def.flags);
    let model: CommandResult;
    if (args.flags.has('help')) model = args.command === undefined ? helpText() : commandHelp(routed.name);
    else if (args.flags.has('version') || args.flags.has('v')) model = {version: VERSION};
    else {
      if (args.positional.length > 1 || (routed.name === 'home' && routed.positional !== undefined))
        throw new AxiError({code: 'usage'}, 'Unexpected positional argument', ['Run `figma-axi --help` for examples']);
      if (def.positional && routed.positional === undefined)
        throw new AxiError({code: 'usage'}, routed.name + ' needs a Figma URL or file key', ['Run `figma-axi ' + routed.name + ' --help` for examples']);
      const ctx: CommandContext = {
        figma: op => figmaGet(op, runtime), fetch: runtime.fetch,
        tmpdir: runtime.tmpdir ?? tmpdir(), bin: sanitize(runtime.bin ?? resolve(process.argv[1] ?? 'bin/figma-axi')),
      };
      // The discriminant keeps each registry handler's ref and flags paired, without erasing its contract.
      switch (routed.name) {
        case 'home': model = await REGISTRY.home.run({ref: null, flags: parseFlags(args, REGISTRY.home.def.flags)}, ctx); break;
        case 'outline': model = await REGISTRY.outline.run({ref: parseRef(routed.positional!, undefined), flags: parseFlags(args, REGISTRY.outline.def.flags)}, ctx); break;
        case 'inspect': {
          const flags = parseFlags(args, REGISTRY.inspect.def.flags);
          model = await REGISTRY.inspect.run({ref: requireNode(parseRef(routed.positional!, flags.node), 'inspect'), flags}, ctx); break;
        }
        case 'render': {
          const flags = parseFlags(args, REGISTRY.render.def.flags);
          model = await REGISTRY.render.run({ref: requireNode(parseRef(routed.positional!, flags.node), 'render'), flags: {...flags, out: args.flags.has('out') ? flags.out : join(ctx.tmpdir, 'figma-axi')}}, ctx); break;
        }
        case 'comments': model = await REGISTRY.comments.run({ref: parseRef(routed.positional!, undefined), flags: parseFlags(args, REGISTRY.comments.def.flags)}, ctx); break;
        default: {const exhaustive: never = routed.name; return exhaustive;}
      }
    }
    output = serialize(model);
    guard(output);
  } catch (error) {
    const failure = error instanceof AxiError ? error : new AxiError({code: 'internal_error'}, 'Unexpected internal error', ['This is a figma-axi bug; re-run with --json and report the output']);
    exit = EXIT[failure.detail.code];
    output = serialize(errorModel(failure));
    try { guard(output); }
    catch (error) {
      const failure = error instanceof AxiError ? error : new AxiError({code: 'security'}, 'Output refused');
      exit = EXIT[failure.detail.code];
      output = serialize({error: 'Output refused', code: failure.detail.code, help: ['Check response content before retrying']});
      // A credential may equal even a fixed diagnostic word; silence is safer than leaking it.
      if (hidden.some(secret => output.includes(secret))) output = '';
    }
  }
  if (output) runtime.write(output + '\n');
  return exit;
}
