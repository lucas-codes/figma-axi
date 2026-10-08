import {AxiError} from '../errors.ts';
import type {Handler, CommentsDef} from '../registry.ts';
export const run: Handler<CommentsDef> = async (_input, _ctx) => {
  throw new AxiError({code: 'not_implemented'}, 'comments is not implemented', ['Run `figma-axi comments --help` for the planned interface']);
};
