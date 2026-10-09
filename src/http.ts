import type { GetFileQueryParams, GetFileNodesQueryParams, GetImagesQueryParams, GetCommentsQueryParams } from '@figma/rest-api-spec';
import type { FileKey, NodeId } from './ref.ts';
import { AxiError } from './errors.ts';
import { assertNoSecret, sanitize, type Env } from './security.ts';
export const FIGMA_ORIGIN = 'https://api.figma.com';
export type ImageFormat = Exclude<NonNullable<GetImagesQueryParams['format']>, 'pdf'>;
export type Operation =
  | {op: 'getMe'}
  | {op: 'getFile'; fileKey: FileKey; query: Required<Pick<GetFileQueryParams, 'depth'>>}
  | {op: 'getFileNodes'; fileKey: FileKey; query: Required<Pick<GetFileNodesQueryParams, 'depth'>> & {ids: NodeId}}
  | {op: 'getImages'; fileKey: FileKey; query: Required<Pick<GetImagesQueryParams, 'scale'>> & {ids: NodeId; format: ImageFormat}}
  | {op: 'getComments'; fileKey: FileKey; query: Required<GetCommentsQueryParams>};
const SCOPE = {
  getMe: 'current_user:read',
  getFile: 'file_content:read',
  getFileNodes: 'file_content:read',
  getImages: 'file_content:read',
  getComments: 'file_comments:read',
} as const satisfies Record<Operation['op'], string>;
export type FigmaGet = (op: Operation) => Promise<unknown>;
export function operationUrl(op: Operation): URL {
  let path: string;
  switch (op.op) {
    case 'getMe': path = '/v1/me'; break;
    case 'getFile': path = '/v1/files/' + op.fileKey; break;
    case 'getFileNodes': path = '/v1/files/' + op.fileKey + '/nodes'; break;
    case 'getImages': path = '/v1/images/' + op.fileKey; break;
    case 'getComments': path = '/v1/files/' + op.fileKey + '/comments'; break;
    default: { const exhaustive: never = op; return exhaustive; }
  }
  const url = new URL(path, FIGMA_ORIGIN);
  if ('query' in op) for (const [key, value] of Object.entries(op.query)) url.searchParams.set(key, String(value));
  return url;
}
const CAP = 16 * 1024 * 1024;
async function readCapped(response: Response, controller: AbortController): Promise<string> {
  if (Number(response.headers.get('content-length')) > CAP) {
    controller.abort();
    throw new AxiError({code: 'response_too_large'}, 'Response exceeds 16 MiB', ['Reduce the requested depth']);
  }
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > CAP) {
        controller.abort();
        await reader.cancel();
        throw new AxiError({code: 'response_too_large'}, 'Response exceeds 16 MiB', ['Reduce the requested depth']);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}
export async function figmaGet(op: Operation, rt: {env: Env; fetch: typeof globalThis.fetch}): Promise<unknown> {
  const token = rt.env.FIGMA_TOKEN;
  if (!token) throw new AxiError({code: 'token_missing'}, 'FIGMA_TOKEN is not set', ['Create a personal access token in Figma Settings then Security']);
  if (!/^[\x21-\x7e]+$/.test(token)) throw new AxiError({code: 'security'}, 'Invalid FIGMA_TOKEN characters', ['Export the token without whitespace or control characters']);
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new AxiError({code: 'transport_error'}, 'Request deadline exceeded', ['Check connectivity before retrying'])); }, 60000);
  });
  const work = async () => {
    const response = await rt.fetch(operationUrl(op).href, {method: 'GET', redirect: 'manual', headers: {'X-Figma-Token': token, Accept: 'application/json'}, signal: controller.signal});
    if (response.status >= 300 && response.status < 400) throw new AxiError({code: 'security'}, 'Redirect refused', ['Use the official Figma REST API']);
    if (response.status === 429) {
      const retry = response.headers.get('Retry-After');
      const rate = response.headers.get('X-Figma-Rate-Limit-Type');
      const plan = response.headers.get('X-Figma-Plan-Tier');
      if (plan !== null) assertNoSecret(plan, [token]);
      throw new AxiError({code: 'rate_limited', retryAfter: retry && /^\d+$/.test(retry) && Number(retry) <= 86400 ? Number(retry) : null,
        rateLimitType: rate === 'low' || rate === 'high' ? rate : null, planTier: plan === null ? null : sanitize(plan).slice(0, 200)},
        'Figma rate limit reached', ['Wait for Retry-After before retrying']);
    }
    const json = /^application\/(?:[\w.+-]*\+)?json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '');
    let data: unknown = null;
    if (json) {
      const raw = await readCapped(response, controller);
      assertNoSecret(raw, [token]);
      try { data = JSON.parse(raw); }
      catch { if (response.ok) throw new AxiError({code: 'bad_response'}, 'Invalid JSON response', ['Check the Figma API response']); }
      assertNoSecret(JSON.stringify(data), [token]);
    }
    if (!response.ok) {
      const code = response.status === 400 ? 'bad_request' : response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden' : response.status === 404 ? 'not_found' : 'http_error';
      const figma = data && typeof data === 'object' && 'err' in data && typeof data.err === 'string' ? sanitize(data.err).slice(0, 200) : null;
      let help: string;
      switch (response.status) {
        case 401: help = 'Check FIGMA_TOKEN is a valid, unexpired personal access token'; break;
        case 403: help = 'Check FIGMA_TOKEN has the ' + SCOPE[op.op] + ' scope' +
          (op.op === 'getMe' ? '' : ' and that its account can open this file'); break;
        case 404: help = "Check the file key in the URL; the token's account may not be able to see this file"; break;
        case 400: help = 'Check the URL, node id and flags'; break;
        default: help = 'Figma returned HTTP ' + response.status + '; retry later';
      }
      throw new AxiError({code, status: response.status, figma}, 'Figma refused the request (' + response.status + ')', [help]);
    }
    if (!json) throw new AxiError({code: 'bad_response'}, 'Expected JSON response', ['Check the Figma API response']);
    return data;
  };
  try { return await Promise.race([work(), deadline]); }
  catch (error) {
    if (error instanceof AxiError) throw error;
    throw new AxiError({code: 'transport_error'}, 'Request failed', ['Check connectivity before retrying']);
  } finally { clearTimeout(timer); controller.abort(); }
}
