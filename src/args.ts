import { AxiError } from './errors.ts';
import type { FlagDef, Flags } from './registry.ts';
export interface Args {command?: string; positional: string[]; flags: Map<string, string | true>}
export function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();
  const boolean = new Set(['help', 'version', 'v', 'json', 'full', 'resolved']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--') { positional.push(...argv.slice(i + 1)); break; }
    if (a.startsWith('-') && a.length > 1) {
      const raw = a.replace(/^--?/, '');
      const eq = raw.indexOf('=');
      if (eq >= 0) { flags.set(raw.slice(0, eq), raw.slice(eq + 1)); continue; }
      const next = argv[i + 1];
      if (!boolean.has(raw) && next !== undefined && (!next.startsWith('-') || /^-\d/.test(next))) {
        flags.set(raw, next); i++;
      } else flags.set(raw, true);
    } else positional.push(a);
  }
  return {command: positional.shift(), positional, flags};
}
export function assertKnownFlags(args: Args, defs: Record<string, FlagDef>, command: string): void {
  const validFlags = [...Object.keys(defs).map(k => '--' + k), '--json'];
  for (const key of args.flags.keys()) {
    if (!Object.hasOwn(defs, key) && !['help', 'version', 'v', 'json'].includes(key))
      throw new AxiError({code: 'usage', validFlags}, 'unknown flag: ' + (key.length === 1 ? '-' : '--') + key,
        ['Run `figma-axi ' + command + ' --help` for flags and examples']);
  }
}
export function parseFlags<F extends Record<string, FlagDef>>(args: Args, defs: F): Flags<F> {
  const values: Record<string, string | number | boolean | undefined> = {json: args.flags.has('json')};
  for (const [name, def] of Object.entries(defs)) {
    const raw = args.flags.get(name);
    const fail = () => new AxiError({code: 'usage'}, 'Invalid value for --' + name, ['Run `figma-axi ' + (args.command ?? '') + ' --help` for flags and examples']);
    if (def.kind === 'boolean') {
      if (raw !== undefined && raw !== true) throw fail();
      values[name] = raw === true;
    } else if (raw === undefined) values[name] = def.default ?? undefined;
    else if (typeof raw !== 'string' || !raw.length) throw fail();
    else if (def.kind === 'string') values[name] = raw;
    else if (def.kind === 'enum') {
      if (!def.values.includes(raw)) throw fail();
      values[name] = raw;
    } else {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < def.min || n > def.max || (def.kind === 'integer' && !Number.isInteger(n))) throw fail();
      values[name] = n;
    }
  }
  for (const key of ['json', 'help', 'version', 'v'])
    if (args.flags.has(key) && args.flags.get(key) !== true) throw new AxiError({code: 'usage'}, '--' + key + ' takes no value', ['Run `figma-axi --help` for flags']);
  // Every field was validated against its definition above; mapped generics cannot narrow at runtime.
  return values as Flags<F>;
}
