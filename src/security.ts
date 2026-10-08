import { AxiError } from './errors.ts';
export type Env = Record<string, string | undefined>;
export function sanitize(value: string, body = false): string {
  return value
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD')
    .replace(/(?:\x1b\[|\u009b)[0-?]*[ -/]*[@-~]/g, '')
    .replace(/(?:\x1b\]|\u009d)[\s\S]*?(?:\x07|\x1b\\|\u009c)/g, '')
    .replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, '')
    .replace(/[\n\t]/g, body ? '$&' : ' ');
}
export function redact(value: string, hidden: readonly string[]): string {
  for (const secret of hidden) value = value.split(secret).join('[redacted]');
  return value;
}
export function assertNoSecret(value: string, hidden: readonly string[]): void {
  if (hidden.some(s => value.includes(s) || sanitize(value, true).includes(s) || value.includes(JSON.stringify(s).slice(1, -1))))
    throw new AxiError({code: 'security'}, 'Secret detected in output', ['Check the response content before retrying']);
}
