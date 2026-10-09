import type {GetFileNodesResponse, GetLocalVariablesResponse} from '@figma/rest-api-spec';
import type {DeepPartial, Scenario} from '../harness.ts';
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
  instances: [{id: '1-3', component: 'Dialog/Header', variant: 'Align=Left', props: 'Dismiss=false;Icon=Dialog/Header'}],
  imageFills: 1,
};
const nodesUrl = 'https://api.figma.com/v1/files/AbC123xyz456/nodes?ids=1%3A2&depth=5';
const variablesUrl = 'https://api.figma.com/v1/files/AbC123xyz456/variables/local';
const counts = {hidden: 1, shapesOmitted: 1, beyondLimit: 0, instanceLayersSkipped: 1};
const help = ['Run `figma-axi assets AbC123xyz456 --node 1-2` to save 1 image fill', 'Run `figma-axi spec AbC123xyz456 --node 1-3` for the layers inside an instance', 'Run `figma-axi render AbC123xyz456 --node 1-2` to see this frame'];
const resolvedSpec = {
  ...unavailableSpec,
  layers: unavailableSpec.layers.map((layer, i) => i === 0 ? {...layer, fill: 'solid #FFFFFF <Colors/Neutral/White> <white>', radius: '12 <radius/md>'} : layer),
  tokens: [unavailableSpec.tokens[0], {...unavailableSpec.tokens[1], label: 'white', code: 'var(--white)'}, {...unavailableSpec.tokens[2], label: 'radius/md'}],
};
export const partialNames = {...variableNames, meta: {...variableNames.meta, variables: {[colorId]: variableNames.meta.variables[colorId]}}} satisfies DeepPartial<GetLocalVariablesResponse>;
export const unboundFrame = {name: 'Product', nodes: {'1:2': {components: {}, styles: designFrame.nodes['1:2'].styles, document: {id: '1:2', type: 'FRAME', name: 'Unbound', fills: [{type: 'SOLID', color: {r: 1, g: 1, b: 1, a: 1}}], styles: {fill: '31:1'}}}}} satisfies DeepPartial<GetFileNodesResponse>;
export const goldenCases = {
  'spec-unavailable': {argv: ['spec', 'AbC123xyz456', '--node', '1-2'], routes: {[nodesUrl]: {body: designFrame}, [variablesUrl]: {status: 403, body: {message: 'Invalid scope(s): file_variables:read'}}}, exit: 0,
    model: {file: 'Product', node: '1-2', depth: 5, variableNames: 'unavailable', ...counts, ...unavailableSpec, attention: ['Variable names are unavailable (Figma 403: Invalid scope(s): file_variables:read). They need a token with the file_variables:read scope on an Enterprise org; until then labels are var.<key prefix> and the value column is what the design resolves to'], help}},
  'spec-resolved': {argv: ['spec', 'AbC123xyz456', '--node', '1-2'], routes: {[nodesUrl]: {body: designFrame}, [variablesUrl]: {body: variableNames}}, exit: 0,
    model: {file: 'Product', node: '1-2', depth: 5, variableNames: 'resolved', ...counts, ...resolvedSpec, help}},
  'spec-partial': {argv: ['spec', 'AbC123xyz456', '--node', '1-2'], routes: {[nodesUrl]: {body: designFrame}, [variablesUrl]: {body: partialNames}}, exit: 0,
    model: {file: 'Product', node: '1-2', depth: 5, variableNames: 'partial', ...counts, ...resolvedSpec, layers: resolvedSpec.layers.map((layer, i) => i === 0 ? {...layer, radius: '12 <var.20293d10>'} : layer), tokens: [resolvedSpec.tokens[0], resolvedSpec.tokens[1], unavailableSpec.tokens[2]], attention: ['1 referenced variable has no matching name; unmatched labels are var.<key prefix>'], help}},
  'spec-none-bound': {argv: ['spec', 'AbC123xyz456', '--node', '1-2'], routes: {[nodesUrl]: {body: unboundFrame}}, exit: 0,
    model: {file: 'Product', node: '1-2', depth: 5, variableNames: 'none-bound', hidden: 0, shapesOmitted: 0, beyondLimit: 0, instanceLayersSkipped: 0, layers: [{depth: 0, id: '1-2', type: 'FRAME', name: 'Unbound', size: null, layout: null, fill: 'solid #FFFFFF <Colors/Neutral/White>', stroke: null, radius: null, effect: null, text: null}], tokens: [unavailableSpec.tokens[0]], instances: [], imageFills: 0, help: ['Run `figma-axi render AbC123xyz456 --node 1-2` to see this frame']}},
} satisfies Record<string, Scenario>;
