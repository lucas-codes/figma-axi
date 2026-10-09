import type {GetFileNodesResponse, GetLocalVariablesResponse} from '@figma/rest-api-spec';
import type {DeepPartial} from '../harness.ts';
export const colorId = 'VariableID:becc5963959f6b0d8b557259e9c05419018ec695/11:1';
export const radiusId = 'VariableID:20293d104b170164dd0c1bcd960e51cb856d7c36/11:2';
export const designFrame = {
  name: 'Product', nodes: {'1:2': {
    styles: {'31:1': {key: '8accb1306182587aebf4f48a69692466e80ccf1b', name: 'Colors/Neutral/White', styleType: 'FILL'}},
    components: {'21:2': {name: 'Align=Left', componentSetId: '21:1'}},
    componentSets: {'21:1': {name: 'Dialog/Header'}},
    document: {id: '1:2', type: 'FRAME', name: 'Feature announcement', absoluteBoundingBox: {width: 480, height: 356},
      layoutMode: 'VERTICAL', itemSpacing: 16, paddingTop: 16, paddingRight: 24, paddingBottom: 16, paddingLeft: 24,
      primaryAxisAlignItems: 'MIN', counterAxisAlignItems: 'CENTER', layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'HUG',
      cornerRadius: 12, rectangleCornerRadii: [12, 12, 12, 12],
      fills: [{type: 'SOLID', color: {r: 1, g: 1, b: 1, a: 1}, boundVariables: {color: {type: 'VARIABLE_ALIAS', id: colorId}}}],
      styles: {fill: '31:1'},
      boundVariables: {fills: [{type: 'VARIABLE_ALIAS', id: colorId}], rectangleCornerRadii: {
        RECTANGLE_TOP_LEFT_CORNER_RADIUS: {type: 'VARIABLE_ALIAS', id: radiusId},
        RECTANGLE_TOP_RIGHT_CORNER_RADIUS: {type: 'VARIABLE_ALIAS', id: radiusId},
        RECTANGLE_BOTTOM_RIGHT_CORNER_RADIUS: {type: 'VARIABLE_ALIAS', id: radiusId},
        RECTANGLE_BOTTOM_LEFT_CORNER_RADIUS: {type: 'VARIABLE_ALIAS', id: radiusId},
      }},
      children: [
        {id: '1:3', type: 'INSTANCE', name: 'Header', componentId: '21:2', componentProperties: {
          Align: {type: 'VARIANT', value: 'Left'}, 'Dismiss#10:2': {type: 'BOOLEAN', value: false},
          Icon: {type: 'INSTANCE_SWAP', value: '21:2'},
        }, children: [{id: '2:1', type: 'TEXT', name: 'Inside', characters: 'Title'}]},
        {id: '1:4', type: 'TEXT', name: 'Title', characters: 'Trade in', style: {fontFamily: 'Inter', fontWeight: 600, fontSize: 18, lineHeightPx: 24, letterSpacing: -0.5}},
        {id: '1:5', type: 'RECTANGLE', name: 'Hero', fills: [{type: 'IMAGE', scaleMode: 'FILL', imageRef: '4f532c6f0e5b70accac71eba11a82c78d2f29bbf'}]},
        {id: '1:6', type: 'FRAME', name: 'Hidden', visible: false},
        {id: '1:7', type: 'VECTOR', name: 'Shape'},
      ],
    },
  }},
} satisfies DeepPartial<GetFileNodesResponse>;
export const variableNames = {
  status: 200, error: false, meta: {variables: {
    [colorId]: {id: colorId, key: 'becc5963959f6b0d8b557259e9c05419018ec695', name: 'white', variableCollectionId: 'col', codeSyntax: {WEB: 'var(--white)'}},
    [radiusId]: {id: radiusId, key: '20293d104b170164dd0c1bcd960e51cb856d7c36', name: 'radius/md', variableCollectionId: 'col', codeSyntax: {}},
  }, variableCollections: {col: {name: 'Primitives'}}},
} satisfies DeepPartial<GetLocalVariablesResponse>;
export const unavailableSpec = {
  layers: [
    {depth: 0, id: '1-2', type: 'FRAME', name: 'Feature announcement', size: '480x356 fixed/hug', layout: 'col gap=16 pad=16/24 main=start cross=center', fill: 'solid #FFFFFF <Colors/Neutral/White> <var.becc5963>', stroke: null, radius: '12 <var.20293d10>', effect: null, text: null},
    {depth: 1, id: '1-3', type: 'INSTANCE', name: 'Header', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 1, id: '1-4', type: 'TEXT', name: 'Title', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: 'Inter 600 18/24 ls=-0.5'},
    {depth: 1, id: '1-5', type: 'RECTANGLE', name: 'Hero', size: null, layout: null, fill: 'image 4f532c6f fill', stroke: null, radius: null, effect: null, text: null},
  ],
  tokens: [
    {label: 'Colors/Neutral/White', source: 'style', id: '8accb1306182587aebf4f48a69692466e80ccf1b', value: '#FFFFFF', fields: 'fill', uses: 1, code: null},
    {label: 'var.becc5963', source: 'variable', id: colorId, value: '#FFFFFF', fields: 'fill', uses: 1, code: null},
    {label: 'var.20293d10', source: 'variable', id: radiusId, value: '12', fields: 'radius', uses: 1, code: null},
  ],
  instances: [{id: '1-3', component: 'Dialog/Header', variant: 'Align=Left', props: 'Dismiss=false;Icon=Align=Left'}],
  imageFills: 1,
};
