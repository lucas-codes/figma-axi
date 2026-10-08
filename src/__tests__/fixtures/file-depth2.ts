import type {GetFileResponse} from '@figma/rest-api-spec';
import type {DeepPartial, Scenario} from '../harness.ts';
export const file = {
  name: 'Checkout redesign', lastModified: '2026-10-01T14:22:05Z', components: {},
  document: {id: '0:0', type: 'DOCUMENT', name: 'Document', children: [
    {id: '0:1', type: 'CANVAS', name: 'Flows', children: [
      {id: '1:2', type: 'FRAME', name: 'Cart desktop', absoluteBoundingBox: {width: 1440, height: 1024}},
      {id: '1:3', type: 'FRAME', name: 'Cart mobile', absoluteBoundingBox: {width: 390, height: 844}},
      {id: '4:10', type: 'SECTION', name: 'Payment', absoluteBoundingBox: {width: 2400, height: 1200}},
    ]},
    {id: '12:0', type: 'CANVAS', name: 'Archive', children: [
      {id: '12:5', type: 'FRAME', name: 'Old cart', absoluteBoundingBox: {width: 1440, height: 1024}},
    ]},
  ]},
} satisfies DeepPartial<GetFileResponse>;
export const outlineModel = {
  file: 'Checkout redesign', key: 'AbC123xyz456', lastModified: '2026-10-01T14:22:05Z', pages: 2,
  hidden: 0, shapesOmitted: 0, beyondLimit: 0, textsTruncated: 0,
  nodes: [
    {depth: 0, id: '0-1', type: 'CANVAS', name: 'Flows', size: null, content: null},
    {depth: 1, id: '1-2', type: 'FRAME', name: 'Cart desktop', size: '1440x1024', content: null},
    {depth: 1, id: '1-3', type: 'FRAME', name: 'Cart mobile', size: '390x844', content: null},
    {depth: 1, id: '4-10', type: 'SECTION', name: 'Payment', size: '2400x1200', content: null},
    {depth: 0, id: '12-0', type: 'CANVAS', name: 'Archive', size: null, content: null},
    {depth: 1, id: '12-5', type: 'FRAME', name: 'Old cart', size: '1440x1024', content: null},
  ],
  help: [
    "Run `figma-axi inspect AbC123xyz456 --node 1-2` for a frame's layers and text",
    'Run `figma-axi inspect AbC123xyz456 --node 4-10 --depth 1` to list the frames inside a SECTION',
  ],
};
export const goldenCases = {
  outline: {argv: ['outline', 'https://www.figma.com/design/AbC123xyz456/Checkout'],
    routes: {'https://api.figma.com/v1/files/AbC123xyz456?depth=2': {body: file}}, exit: 0, model: outlineModel},
} satisfies Record<string, Scenario>;
