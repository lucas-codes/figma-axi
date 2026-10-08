import {AxiError} from '../errors.ts';
import type {Handler, InspectDef} from '../registry.ts';
export const run: Handler<InspectDef> = async (_input, _ctx) => {
  throw new AxiError({code: 'not_implemented'}, 'inspect is not implemented', ['Run `figma-axi inspect --help` for the planned interface']);
};
