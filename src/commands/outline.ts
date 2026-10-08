import {AxiError} from '../errors.ts';
import type {Handler, OutlineDef} from '../registry.ts';
export const run: Handler<OutlineDef> = async (_input, _ctx) => {
  throw new AxiError({code: 'not_implemented'}, 'outline is not implemented', ['Run `figma-axi outline --help` for the planned interface']);
};
