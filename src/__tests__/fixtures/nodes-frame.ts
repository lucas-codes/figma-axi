import type {GetFileNodesResponse} from '@figma/rest-api-spec';
import type {DeepPartial, Scenario} from '../harness.ts';
export const frame = {
  name: 'Checkout redesign', nodes: {'1:2': {
    components: {'20:1': {name: 'Cart/LineItem'}, '20:2': {name: 'Button/Primary'}},
    document: {id: '1:2', type: 'FRAME', name: 'Cart desktop', absoluteBoundingBox: {width: 1440, height: 1024}, children: [
      {id: '1:5', type: 'TEXT', name: 'Title', characters: 'Your cart', absoluteBoundingBox: {width: 320, height: 40}},
      {id: '1:6', type: 'FRAME', name: 'Line items', absoluteBoundingBox: {width: 1200, height: 400}, children: [
        {id: '1:7', type: 'INSTANCE', name: 'Line item', componentId: '20:1', absoluteBoundingBox: {width: 1200, height: 96}, children: [
          {id: '2:1', type: 'TEXT', name: 'Product', characters: 'Trail runner'},
          {id: '2:2', type: 'TEXT', name: 'Price', characters: '$128.00'},
        ]},
        {id: '1:8', type: 'INSTANCE', name: 'Line item', componentId: '20:1', absoluteBoundingBox: {width: 1200, height: 96}, children: [
          {id: '2:3', type: 'TEXT', name: 'Product', characters: 'Rain shell'},
          {id: '2:4', type: 'TEXT', name: 'Price', characters: '$96.00'},
        ]},
      ]},
      {id: '1:9', type: 'FRAME', name: 'Summary', absoluteBoundingBox: {width: 400, height: 320}, children: [
        {id: '1:10', type: 'TEXT', name: 'Tax label', characters: 'Tax (13%)', absoluteBoundingBox: {width: 200, height: 24}},
        {id: '1:11', type: 'TEXT', name: 'Shipping note', characters: 'Free shipping, 3-5 days', absoluteBoundingBox: {width: 360, height: 48}},
        {id: '1:12', type: 'INSTANCE', name: 'CTA', componentId: '20:2', absoluteBoundingBox: {width: 360, height: 56}, children: [
          {id: '2:5', type: 'TEXT', name: 'Label', characters: 'Place order'},
        ]},
      ]},
      {id: '3:1', type: 'FRAME', name: 'Hidden', visible: false, children: [
        {id: '3:2', type: 'TEXT', name: 'Hidden descendant', characters: 'secret', visible: false},
      ]},
      {id: '3:3', type: 'TEXT', name: 'Hidden text', characters: 'secret', visible: false},
      ...Array.from({length: 14}, (_, i) => ({id: '9:' + i, type: 'VECTOR' as const, name: 'Decoration'})),
    ]},
  }},
} satisfies DeepPartial<GetFileNodesResponse>;
export const inspectModel = {
  file: 'Checkout redesign', node: '1-2', depth: 5, hidden: 2, shapesOmitted: 14, beyondLimit: 0, textsTruncated: 0,
  nodes: [
    {depth: 0, id: '1-2', type: 'FRAME', name: 'Cart desktop', size: '1440x1024', content: null},
    {depth: 1, id: '1-5', type: 'TEXT', name: 'Title', size: '320x40', content: 'Your cart'},
    {depth: 1, id: '1-6', type: 'FRAME', name: 'Line items', size: '1200x400', content: null},
    {depth: 2, id: '1-7', type: 'INSTANCE', name: 'Line item', size: '1200x96', content: 'Cart/LineItem | Trail runner | $128.00'},
    {depth: 2, id: '1-8', type: 'INSTANCE', name: 'Line item', size: '1200x96', content: 'Cart/LineItem | Rain shell | $96.00'},
    {depth: 1, id: '1-9', type: 'FRAME', name: 'Summary', size: '400x320', content: null},
    {depth: 2, id: '1-10', type: 'TEXT', name: 'Tax label', size: '200x24', content: 'Tax (13%)'},
    {depth: 2, id: '1-11', type: 'TEXT', name: 'Shipping note', size: '360x48', content: 'Free shipping, 3-5 days'},
    {depth: 2, id: '1-12', type: 'INSTANCE', name: 'CTA', size: '360x56', content: 'Button/Primary | Place order'},
  ],
  help: [
    'Run `figma-axi render AbC123xyz456 --node 1-2` to see this frame',
    'Run `figma-axi inspect AbC123xyz456 --node 1-6` to focus on one child',
  ],
};
export const goldenCases = {
  inspect: {argv: ['https://www.figma.com/design/AbC123xyz456/Checkout?node-id=1-2'],
    routes: {'https://api.figma.com/v1/files/AbC123xyz456/nodes?ids=1%3A2&depth=5': {body: frame}}, exit: 0, model: inspectModel},
} satisfies Record<string, Scenario>;
