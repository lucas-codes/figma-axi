import type {GetFileNodesResponse, GetLocalVariablesResponse} from '@figma/rest-api-spec';
import type {DeepPartial} from '../harness.ts';
export const colorId = 'VariableID:5b33ff34fe49f7347b7d06be6778f40205860838/4096:10';
export const radiusId = 'VariableID:cf9dcd3dd4ec51eb709e9b1ebfbc8e8fc8c78b90/4476:170';
export const designFrame = {
  name: 'Trade-ins', nodes: {'1:2': {
    styles: {'4010:3255': {key: 'de03efcb555feb117490f875d1c3b4561ccc9671', name: 'Primitives/Grey/$white', styleType: 'FILL'}},
    components: {'10144:90268': {name: 'Positioning=Left', componentSetId: '10144:90267'}},
    componentSets: {'10144:90267': {name: 'Assets/DialogHeader'}},
    document: {id: '1:2', type: 'FRAME', name: 'Trade-ins announcement', absoluteBoundingBox: {width: 480, height: 356},
      layoutMode: 'VERTICAL', itemSpacing: 16, paddingTop: 16, paddingRight: 24, paddingBottom: 16, paddingLeft: 24,
      primaryAxisAlignItems: 'MIN', counterAxisAlignItems: 'CENTER', layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'HUG',
      cornerRadius: 12, rectangleCornerRadii: [12, 12, 12, 12],
      fills: [{type: 'SOLID', color: {r: 1, g: 1, b: 1, a: 1}, boundVariables: {color: {type: 'VARIABLE_ALIAS', id: colorId}}}],
      styles: {fill: '4010:3255'},
      boundVariables: {fills: [{type: 'VARIABLE_ALIAS', id: colorId}], rectangleCornerRadii: {
        RECTANGLE_TOP_LEFT_CORNER_RADIUS: {type: 'VARIABLE_ALIAS', id: radiusId},
        RECTANGLE_TOP_RIGHT_CORNER_RADIUS: {type: 'VARIABLE_ALIAS', id: radiusId},
        RECTANGLE_BOTTOM_RIGHT_CORNER_RADIUS: {type: 'VARIABLE_ALIAS', id: radiusId},
        RECTANGLE_BOTTOM_LEFT_CORNER_RADIUS: {type: 'VARIABLE_ALIAS', id: radiusId},
      }},
      children: [
        {id: '1:3', type: 'INSTANCE', name: 'Header', componentId: '10144:90268', componentProperties: {
          Positioning: {type: 'VARIANT', value: 'Left'}, 'Dismiss#10:2': {type: 'BOOLEAN', value: false},
          Icon: {type: 'INSTANCE_SWAP', value: '10144:90268'},
        }, children: [{id: '2:1', type: 'TEXT', name: 'Inside', characters: 'Title'}]},
        {id: '1:4', type: 'TEXT', name: 'Title', characters: 'Trade in', style: {fontFamily: 'Inter', fontWeight: 600, fontSize: 18, lineHeightPx: 24, letterSpacing: -0.5}},
        {id: '1:5', type: 'RECTANGLE', name: 'Hero', fills: [{type: 'IMAGE', scaleMode: 'FILL', imageRef: 'ec840832b7458a98af173527f74b167e3ec500d2'}]},
        {id: '1:6', type: 'FRAME', name: 'Hidden', visible: false},
        {id: '1:7', type: 'VECTOR', name: 'Shape'},
      ],
    },
  }},
} satisfies DeepPartial<GetFileNodesResponse>;
export const variableNames = {
  status: 200, error: false, meta: {variables: {
    [colorId]: {id: colorId, key: '5b33ff34fe49f7347b7d06be6778f40205860838', name: 'white', variableCollectionId: 'col', codeSyntax: {WEB: 'var(--white)'}},
    [radiusId]: {id: radiusId, key: 'cf9dcd3dd4ec51eb709e9b1ebfbc8e8fc8c78b90', name: 'radius/md', variableCollectionId: 'col', codeSyntax: {}},
  }, variableCollections: {col: {name: 'Primitives'}}},
} satisfies DeepPartial<GetLocalVariablesResponse>;
export const unavailableSpec = {
  layers: [
    {depth: 0, id: '1-2', type: 'FRAME', name: 'Trade-ins announcement', size: '480x356 fixed/hug', layout: 'col gap=16 pad=16/24 main=start cross=center', fill: 'solid #FFFFFF <Primitives/Grey/$white> <var.5b33ff34>', stroke: null, radius: '12 <var.cf9dcd3d>', effect: null, text: null},
    {depth: 1, id: '1-3', type: 'INSTANCE', name: 'Header', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 1, id: '1-4', type: 'TEXT', name: 'Title', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: 'Inter 600 18/24 ls=-0.5'},
    {depth: 1, id: '1-5', type: 'RECTANGLE', name: 'Hero', size: null, layout: null, fill: 'image ec840832 fill', stroke: null, radius: null, effect: null, text: null},
  ],
  tokens: [
    {label: 'Primitives/Grey/$white', source: 'style', id: 'de03efcb555feb117490f875d1c3b4561ccc9671', value: '#FFFFFF', fields: 'fill', uses: 1, code: null},
    {label: 'var.5b33ff34', source: 'variable', id: colorId, value: '#FFFFFF', fields: 'fill', uses: 1, code: null},
    {label: 'var.cf9dcd3d', source: 'variable', id: radiusId, value: '12', fields: 'radius', uses: 1, code: null},
  ],
  instances: [{id: '1-3', component: 'Assets/DialogHeader', variant: 'Positioning=Left', props: 'Dismiss=false;Icon=Positioning=Left'}],
  imageFills: 1,
};
