import type {GetMeResponse} from '@figma/rest-api-spec';
import {AxiError} from '../errors.ts';
import {DESCRIPTION, VERSION} from '../help.ts';
import type {Handler, HomeDef} from '../registry.ts';
import {sanitize} from '../security.ts';
type Me = Pick<GetMeResponse, 'handle' | 'email'>;
function parseMe(raw: unknown): Me {
  if (!raw || typeof raw !== 'object' || !('handle' in raw) || typeof raw.handle !== 'string' ||
      !('email' in raw) || typeof raw.email !== 'string')
    throw new AxiError({code: 'bad_response'}, 'Invalid current-user response', ['Check the Figma API response']);
  return {handle: sanitize(raw.handle), email: sanitize(raw.email)};
}
export const run: Handler<HomeDef> = async (_input, ctx) => {
  const base = {bin: ctx.bin, description: DESCRIPTION, version: VERSION};
  let me: Me;
  try { me = parseMe(await ctx.figma({op: 'getMe'})); }
  catch (error) {
    if (!(error instanceof AxiError) || error.detail.code !== 'token_missing') throw error;
    return {...base, auth: 'unavailable',
      attention: ['FIGMA_TOKEN is not set. Create a personal access token in Figma (Settings then Security) with file_content and file_comments read scopes and export it'],
      help: ['Run `figma-axi --help` for setup and every command']};
  }
  return {...base, auth: 'ok (' + me.handle + ' <' + me.email + '>)', help: [
    'Run `figma-axi <figma-url>` to outline a file or inspect the frame its node-id points at',
    'Run `figma-axi render <figma-url>` for a PNG of that frame',
    'Run `figma-axi --help` for every command and flag',
  ]};
};
