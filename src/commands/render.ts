import {AxiError} from '../errors.ts';
import type {Handler, RenderDef} from '../registry.ts';
export const run: Handler<RenderDef> = async (_input, _ctx) => {
  throw new AxiError({code: 'not_implemented'}, 'render is not implemented', ['Run `figma-axi render --help` for the planned interface']);
};
