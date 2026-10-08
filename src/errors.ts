export type ErrorCode = 'usage' | 'token_missing' | 'unauthorized' | 'forbidden' | 'not_found' | 'rate_limited'
  | 'bad_request' | 'http_error' | 'transport_error' | 'bad_response' | 'response_too_large' | 'node_not_found'
  | 'render_failed' | 'download_failed' | 'output_too_large' | 'security' | 'not_implemented' | 'internal_error';
export const EXIT = {
  usage: 2, token_missing: 1, unauthorized: 1, forbidden: 1, not_found: 1, rate_limited: 1,
  bad_request: 1, http_error: 1, transport_error: 1, bad_response: 1, response_too_large: 1,
  node_not_found: 1, render_failed: 1, download_failed: 1, output_too_large: 1, security: 1, not_implemented: 1, internal_error: 1,
} as const satisfies Record<ErrorCode, 1 | 2>;
export type ErrorDetail =
  | { code: 'usage'; validFlags?: readonly string[] }
  | { code: 'rate_limited'; retryAfter: number | null; rateLimitType: 'low' | 'high' | null; planTier: string | null }
  | { code: 'unauthorized' | 'forbidden' | 'not_found' | 'bad_request' | 'http_error'; status: number; figma: string | null }
  | { code: Exclude<ErrorCode, 'usage' | 'rate_limited' | 'unauthorized' | 'forbidden' | 'not_found' | 'bad_request' | 'http_error'> };
export class AxiError extends Error {
  readonly detail: ErrorDetail;
  readonly help: readonly string[];
  constructor(detail: ErrorDetail, message: string, help: readonly string[] = []) {
    super(message);
    this.detail = detail;
    this.help = help;
  }
}
export function errorModel(error: AxiError) {
  return { error: error.message, ...error.detail, help: error.help };
}
