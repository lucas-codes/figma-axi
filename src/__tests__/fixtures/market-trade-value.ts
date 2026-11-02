import type {Scenario} from '../harness.ts';
const card = {id: '11864:166', type: 'INSTANCE', name: 'Card', componentId: '10805:2', componentProperties: {
  'Sections#10805:3': {type: 'SLOT', value: {guid: {sessionID: 11864, localID: 213}}, preferredValues: []},
  Surface: {value: 'Default', type: 'VARIANT', boundVariables: {}},
}, children: [
  {id: 'I11864:166;10805:3', type: 'SLOT', name: 'Sections', children: [
    {id: 'I11864:166;10805:3;11864:214', type: 'INSTANCE', name: 'Card Section', componentId: '10809:2', componentProperties: {
      'Body#10809:256': {type: 'SLOT', value: {guid: {sessionID: 11864, localID: 241}}, preferredValues: []},
      'Actions#10809:255': {type: 'SLOT', value: {guid: {sessionID: 11864, localID: 235}}, preferredValues: []},
      'Title#10809:248': {type: 'TEXT', value: 'Market trade value'},
    }, children: [
      {id: 'I11864:166;10805:3;11864:214;10809:3', type: 'FRAME', name: 'Header', children: [
        {id: 'I11864:166;10805:3;11864:214;10809:4', type: 'FRAME', name: 'Text', children: [
          {id: 'I11864:166;10805:3;11864:214;10825:391', type: 'FRAME', name: 'Title row', children: [
            {id: 'I11864:166;10805:3;11864:214;10809:5', type: 'TEXT', name: 'Title', characters: 'Market trade value'},
          ]},
        ]},
        {id: 'I11864:166;10805:3;11864:214;10809:9', type: 'SLOT', name: 'Actions', children: [
          {id: 'I11864:166;10805:3;11864:214;10809:9;11864:238', type: 'INSTANCE', name: 'Confidence', componentId: '5307:101422', componentProperties: {'Content#1204:0': {type: 'TEXT', value: 'High confidence'}}, children: [
            {id: 'I11864:166;10805:3;11864:214;10809:9;11864:238;5307:101423', type: 'TEXT', name: '{tag text}', characters: 'High confidence'},
          ]},
        ]},
      ]},
      {id: 'I11864:166;10805:3;11864:214;10809:40', type: 'SLOT', name: 'Body', children: [
        {id: 'I11864:166;10805:3;11864:214;10809:40;11864:242', type: 'FRAME', name: 'Studio', children: [
          {id: 'I11864:166;10805:3;11864:214;10809:40;11864:244', type: 'FRAME', name: 'Hero', children: [
            {id: 'I11864:166;10805:3;11864:214;10809:40;11864:246', type: 'TEXT', name: 'Text', characters: '$21,800', absoluteBoundingBox: {width: 95, height: 32}, style: {fontFamily: 'Inter', fontWeight: 700, fontSize: 24, lineHeightPx: 32, letterSpacing: -0.5}},
          ]},
          {id: 'I11864:166;10805:3;11864:214;10809:40;11864:250', type: 'FRAME', name: 'Chart', children: [
            {id: 'I11864:166;10805:3;11864:214;10809:40;11864:264', type: 'FRAME', name: 'Plot row', children: [
              {id: 'I11864:166;10805:3;11864:214;10809:40;11864:275', type: 'FRAME', name: 'Plot', children: [
                {id: 'I11864:166;10805:3;11864:214;10809:40;11864:286', type: 'RECTANGLE', name: 'Bar'},
              ]},
            ]},
          ]},
          {id: 'I11864:166;10805:3;11864:214;10809:40;11864:454', type: 'FRAME', name: 'Legend', children: [
            {id: 'I11864:166;10805:3;11864:214;10809:40;11864:456', type: 'FRAME', name: 'Keys', children: [
              {id: 'I11864:166;10805:3;11864:214;10809:40;11864:459', type: 'FRAME', name: 'Likely range', children: [
                {id: 'I11864:166;10805:3;11864:214;10809:40;11864:462', type: 'TEXT', name: 'Text', characters: 'Likely range'},
              ]},
            ]},
          ]},
        ]},
      ]},
    ]},
    {id: 'I11864:166;10805:3;11864:499', type: 'INSTANCE', name: 'Card Section', visible: false, componentId: '10809:2', componentProperties: {
      'Body#10809:256': {type: 'SLOT', value: {guid: {sessionID: -1, localID: -1}}, preferredValues: []},
      'Actions#10809:255': {type: 'SLOT', value: {guid: {sessionID: 11864, localID: 502}}, preferredValues: []},
    }},
  ]},
]};
const components = {
  '10805:2': {name: 'Surface=Default', componentSetId: '10805:8'},
  '10809:2': {name: 'Surface=Default, State=Default, Expanded=False', componentSetId: '10809:696'},
  '5307:101422': {name: 'Tone=Positive, Size=Medium, Bold=False, Rounded=False, Icon=False', componentSetId: '5307:101339'},
};
const componentSets = {'10805:8': {name: 'Card'}, '10809:696': {name: 'Card Section'}, '5307:101339': {name: 'Badge'}};
export const marketTradeValue = {
  name: '📓 Evolve Components', nodes: {'11864:165': {components, componentSets,
    document: {id: '11864:165', type: 'COMPONENT', name: 'Market Trade Value', children: [card]},
  }},
};
export const marketTradeCard = {name: marketTradeValue.name, nodes: {'11864:166': {components, componentSets, document: card}}};
export const inspectCardModel = {
  file: '📓 Evolve Components', node: '11864-166', depth: 14, hidden: 1, shapesOmitted: 0, beyondLimit: 0, textsTruncated: 0,
  nodes: [
    {depth: 0, id: '11864-166', type: 'INSTANCE', name: 'Card', size: null, content: null},
    {depth: 1, id: 'I11864-166;10805-3', type: 'SLOT', name: 'Sections', size: null, content: null},
    {depth: 2, id: 'I11864-166;10805-3;11864-214', type: 'INSTANCE', name: 'Card Section', size: null, content: 'Surface=Default, State=Default, Expanded=False | Market trade value'},
    {depth: 4, id: 'I11864-166;10805-3;11864-214;10809-9', type: 'SLOT', name: 'Actions', size: null, content: null},
    {depth: 5, id: 'I11864-166;10805-3;11864-214;10809-9;11864-238', type: 'INSTANCE', name: 'Confidence', size: null, content: 'Tone=Positive, Size=Medium, Bold=False, Rounded=False, Icon=False | High confidence'},
    {depth: 3, id: 'I11864-166;10805-3;11864-214;10809-40', type: 'SLOT', name: 'Body', size: null, content: null},
    {depth: 4, id: 'I11864-166;10805-3;11864-214;10809-40;11864-242', type: 'FRAME', name: 'Studio', size: null, content: null},
    {depth: 5, id: 'I11864-166;10805-3;11864-214;10809-40;11864-244', type: 'FRAME', name: 'Hero', size: null, content: null},
    {depth: 6, id: 'I11864-166;10805-3;11864-214;10809-40;11864-246', type: 'TEXT', name: 'Text', size: '95x32', content: '$21,800'},
    {depth: 5, id: 'I11864-166;10805-3;11864-214;10809-40;11864-250', type: 'FRAME', name: 'Chart', size: null, content: null},
    {depth: 6, id: 'I11864-166;10805-3;11864-214;10809-40;11864-264', type: 'FRAME', name: 'Plot row', size: null, content: null},
    {depth: 7, id: 'I11864-166;10805-3;11864-214;10809-40;11864-275', type: 'FRAME', name: 'Plot', size: null, content: null},
    {depth: 8, id: 'I11864-166;10805-3;11864-214;10809-40;11864-286', type: 'RECTANGLE', name: 'Bar', size: null, content: null},
    {depth: 5, id: 'I11864-166;10805-3;11864-214;10809-40;11864-454', type: 'FRAME', name: 'Legend', size: null, content: null},
    {depth: 6, id: 'I11864-166;10805-3;11864-214;10809-40;11864-456', type: 'FRAME', name: 'Keys', size: null, content: null},
    {depth: 7, id: 'I11864-166;10805-3;11864-214;10809-40;11864-459', type: 'FRAME', name: 'Likely range', size: null, content: null},
    {depth: 8, id: 'I11864-166;10805-3;11864-214;10809-40;11864-462', type: 'TEXT', name: 'Text', size: null, content: 'Likely range'},
  ],
  help: ['Run `figma-axi render ubPyiVQXR9Fr0KBrmAdBfg --node 11864-166` to see this frame'],
};
export const specComponentModel = {
  file: '📓 Evolve Components', node: '11864-165', depth: 12, variableNames: 'none-bound', hidden: 1, shapesOmitted: 0, beyondLimit: 0, instanceLayersSkipped: 5,
  layers: [
    {depth: 0, id: '11864-165', type: 'COMPONENT', name: 'Market Trade Value', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 1, id: '11864-166', type: 'INSTANCE', name: 'Card', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 2, id: 'I11864-166;10805-3', type: 'SLOT', name: 'Sections', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 3, id: 'I11864-166;10805-3;11864-214', type: 'INSTANCE', name: 'Card Section', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 5, id: 'I11864-166;10805-3;11864-214;10809-9', type: 'SLOT', name: 'Actions', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 6, id: 'I11864-166;10805-3;11864-214;10809-9;11864-238', type: 'INSTANCE', name: 'Confidence', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 4, id: 'I11864-166;10805-3;11864-214;10809-40', type: 'SLOT', name: 'Body', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 5, id: 'I11864-166;10805-3;11864-214;10809-40;11864-242', type: 'FRAME', name: 'Studio', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 6, id: 'I11864-166;10805-3;11864-214;10809-40;11864-244', type: 'FRAME', name: 'Hero', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 7, id: 'I11864-166;10805-3;11864-214;10809-40;11864-246', type: 'TEXT', name: 'Text', size: '95x32', layout: null, fill: null, stroke: null, radius: null, effect: null, text: 'Inter 700 24/32 ls=-0.5'},
    {depth: 6, id: 'I11864-166;10805-3;11864-214;10809-40;11864-250', type: 'FRAME', name: 'Chart', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 7, id: 'I11864-166;10805-3;11864-214;10809-40;11864-264', type: 'FRAME', name: 'Plot row', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 8, id: 'I11864-166;10805-3;11864-214;10809-40;11864-275', type: 'FRAME', name: 'Plot', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 9, id: 'I11864-166;10805-3;11864-214;10809-40;11864-286', type: 'RECTANGLE', name: 'Bar', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 6, id: 'I11864-166;10805-3;11864-214;10809-40;11864-454', type: 'FRAME', name: 'Legend', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 7, id: 'I11864-166;10805-3;11864-214;10809-40;11864-456', type: 'FRAME', name: 'Keys', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 8, id: 'I11864-166;10805-3;11864-214;10809-40;11864-459', type: 'FRAME', name: 'Likely range', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
    {depth: 9, id: 'I11864-166;10805-3;11864-214;10809-40;11864-462', type: 'TEXT', name: 'Text', size: null, layout: null, fill: null, stroke: null, radius: null, effect: null, text: null},
  ],
  tokens: [],
  instances: [
    {id: '11864-166', component: 'Card', variant: 'Surface=Default', props: 'Sections=null'},
    {id: 'I11864-166;10805-3;11864-214', component: 'Card Section', variant: null, props: 'Body=null;Actions=null;Title=Market trade value'},
    {id: 'I11864-166;10805-3;11864-214;10809-9;11864-238', component: 'Badge', variant: null, props: 'Content=High confidence'},
  ],
  imageFills: 0,
  help: ['Run `figma-axi spec ubPyiVQXR9Fr0KBrmAdBfg --node 11864-166` for the layers inside an instance', 'Run `figma-axi render ubPyiVQXR9Fr0KBrmAdBfg --node 11864-165` to see this frame'],
};
export const goldenCases = {
  'inspect-rest-slot-card': {argv: ['inspect', 'ubPyiVQXR9Fr0KBrmAdBfg', '--node', '11864-166', '--depth', '14'],
    routes: {'https://api.figma.com/v1/files/ubPyiVQXR9Fr0KBrmAdBfg/nodes?ids=11864%3A166&depth=14': {body: marketTradeCard}}, exit: 0, model: inspectCardModel},
  'spec-rest-slot-component': {argv: ['spec', 'ubPyiVQXR9Fr0KBrmAdBfg', '--node', '11864-165', '--depth', '12'],
    routes: {'https://api.figma.com/v1/files/ubPyiVQXR9Fr0KBrmAdBfg/nodes?ids=11864%3A165&depth=12': {body: marketTradeValue}}, exit: 0, model: specComponentModel},
} satisfies Record<string, Scenario>;
