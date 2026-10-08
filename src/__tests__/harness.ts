import {main} from '../index.ts';
import type {Env} from '../security.ts';
import type {GetFileNodesResponse} from '@figma/rest-api-spec';
export type DeepPartial<T> = T extends readonly (infer V)[] ? DeepPartial<V>[] : T extends object ? {[K in keyof T]?: DeepPartial<T[K]>} : T;
export const nodesFixture = {nodes: {'1:2': {document: {id: '1:2', type: 'FRAME', name: 'Cart desktop'}}}} satisfies DeepPartial<GetFileNodesResponse>;
export const env = {FIGMA_TOKEN: 'figd_DUMMY_SECRET'};
export type Reply = {status?: number; headers?: Record<string, string>} & (
  | {body: unknown; bytes?: never; contentType?: never}
  | {bytes: Uint8Array; contentType: string; body?: never}
);
export interface Scenario {
  argv: string[];
  env?: Env;
  tmpdir?: string;
  routes?: Record<string, Reply>;
  exit: number;
  model: unknown;
}
export async function run(argv: string[], routes: Record<string, Reply> = {}, environment: Env = env, tmpdir = '/tmp') {
  const calls: {url: string; init?: RequestInit}[] = [];
  let output = '';
  const exit = await main(argv, {
    env: environment, bin: '/repo/node_modules/.bin/figma-axi', tmpdir,
    fetch: async (url, init) => {
      const key = String(url);
      calls.push({url: key, init});
      const reply = routes[key];
      if (!reply) throw new Error('Unexpected URL: ' + key);
      return reply.bytes !== undefined
        ? new Response(new Uint8Array(reply.bytes), {status: reply.status ?? 200, headers: {...reply.headers, 'content-type': reply.contentType}})
        : new Response(JSON.stringify(reply.body), {status: reply.status ?? 200, headers: {'content-type': 'application/json', ...reply.headers}});
    }, write: value => {output += value;},
  });
  return {exit, output, calls};
}
