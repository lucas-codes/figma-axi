import type {GetMeResponse, ErrorResponsePayloadWithErrorBoolean} from '@figma/rest-api-spec';
import type {DeepPartial, Scenario} from '../harness.ts';
export const me = {id: 'lucas', handle: 'lucas', email: 'lucas@example.com'} satisfies DeepPartial<GetMeResponse>;
const base = {
  bin: '/repo/node_modules/.bin/figma-axi',
  description: 'Read-only Figma REST for agents: frames, layer text, rendered images and comments.',
  version: '0.1.0',
};
export const goldenCases = {
  home: {argv: [], routes: {'https://api.figma.com/v1/me': {body: me}}, exit: 0, model: {...base, auth: 'ok (lucas <lucas@example.com>)', help: [
    'Run `figma-axi <figma-url>` to outline a file or inspect the frame its node-id points at',
    'Run `figma-axi render <figma-url>` for a PNG of that frame',
    'Run `figma-axi --help` for every command and flag',
  ]}},
  'home-no-user-scope': {argv: [], routes: {'https://api.figma.com/v1/me': {status: 403, body: {
    error: true, status: 403, message: 'Invalid scope: ["file_content:read", "file_comments:read"]',
  } satisfies ErrorResponsePayloadWithErrorBoolean}}, exit: 0, model: {...base, auth: 'ok', attention: [
    'FIGMA_TOKEN works but lacks the current_user:read scope, so the account is not shown. File commands are unaffected; add the scope to show it',
  ], help: [
    'Run `figma-axi <figma-url>` to outline a file or inspect the frame its node-id points at',
    'Run `figma-axi render <figma-url>` for a PNG of that frame',
    'Run `figma-axi --help` for every command and flag',
  ]}},
  'home-unavailable': {argv: [], env: {}, exit: 0, model: {...base, auth: 'unavailable', attention: [
    'FIGMA_TOKEN is not set. Create a personal access token in Figma (Settings then Security) with required file_content:read and file_comments:read scopes; current_user:read is optional to show the account. Export it',
  ], help: ['Run `figma-axi --help` for setup and every command']}},
  'error-usage': {argv: ['inspect', 'https://www.figma.com/design/AbC123xyz456/Checkout'], exit: 2, model: {
    error: 'inspect needs a node and the URL has no node-id', code: 'usage', help: [
      'Run `figma-axi outline AbC123xyz456` to list frames and their ids',
      'Run `figma-axi inspect AbC123xyz456 --node <id>`',
    ],
  }},
  'error-forbidden': {argv: [], routes: {'https://api.figma.com/v1/me': {body: {err: 'Invalid token'}, status: 403}}, exit: 1, model: {
    error: 'Figma refused the request (403)', code: 'forbidden', status: 403, figma: 'Invalid token', help: [
      'Check FIGMA_TOKEN is a valid, unexpired personal access token',
    ],
  }},
} satisfies Record<string, Scenario>;
