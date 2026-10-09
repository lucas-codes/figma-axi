import test from 'node:test';
import assert from 'node:assert/strict';
import type {TextNode, FrameNode} from '@figma/rest-api-spec';
import type {DeepPartial} from './harness.ts';
import {AxiError} from '../errors.ts';
import {parseNodeTree, walkLayers} from '../summarize.ts';
import {parseStyleFacet, parseCatalog, buildSpec, boundVariables, parseVariableNames} from '../design.ts';
import {designFrame, unavailableSpec, variableNames, colorId, radiusId} from './fixtures/design.ts';
const entry = designFrame.nodes['1:2'];
const walk = () => walkLayers(parseNodeTree(entry.document, parseStyleFacet), {maxDepth: 5, limit: 300});
test('evaluated styling, style-first labels, deduplicated aliases and instance contracts survive unavailable names', () => {
  assert.deepEqual(buildSpec(walk(), parseCatalog(entry), {status: 'unavailable', figma: 'Invalid scope(s)'}), unavailableSpec);
  assert.deepEqual(walk().counts, {hidden: 1, shapesOmitted: 1, beyondLimit: 0, instanceLayersSkipped: 1});
  assert.deepEqual(boundVariables(walk()).map(ref => ref.id), [colorId, radiusId]);
});
test('names resolve by exact alias or key, without replacing evaluated values', () => {
  const spec = buildSpec(walk(), parseCatalog(entry), parseVariableNames(variableNames));
  assert.equal(spec.layers[0]?.fill, 'solid #FFFFFF <Colors/Neutral/White> <white>');
  assert.equal(spec.layers[0]?.radius, '12 <radius/md>');
  assert.deepEqual(spec.tokens[1], {label: 'white', source: 'variable', id: colorId, value: '#FFFFFF', fields: 'fill', uses: 1, code: 'var(--white)'});
  const byKey = parseVariableNames({...variableNames, meta: {...variableNames.meta, variables: {'other': {...variableNames.meta.variables[colorId], id: 'other'}}}});
  const colorRef = boundVariables(walk())[0];
  assert.ok(colorRef);
  assert.deepEqual(byKey.lookup(colorRef), {name: 'white', collection: 'Primitives', code: 'var(--white)'});
});
test('invisible paints disappear; opacity folds into alpha; gradients, gif precedence, stroke, effects, mixed text and quads format literally', () => {
  const fixture = {id: '1:2', name: 'Styled', type: 'TEXT', characters: 'Text', opacity: 0.5,
    absoluteBoundingBox: {width: 12.6, height: 24}, layoutPositioning: 'ABSOLUTE',
    fills: [{type: 'SOLID', visible: false, color: {r: 1, g: 0, b: 0, a: 1}}, {type: 'SOLID', opacity: 0.5, color: {r: 1, g: 1, b: 1, a: 1}},
      {type: 'GRADIENT_LINEAR', gradientStops: [{color: {r: 0, g: 0, b: 0, a: 1}}, {color: {r: 1, g: 1, b: 1, a: 1}}]},
      {type: 'IMAGE', imageRef: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', gifRef: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', scaleMode: 'FIT'}],
    strokes: [{type: 'SOLID', color: {r: 0, g: 0, b: 0, a: 1}}], strokeWeight: 1, strokeAlign: 'INSIDE',
    effects: [{type: 'DROP_SHADOW', offset: {x: 0, y: 1}, radius: 2, color: {r: 0, g: 0, b: 0, a: 0.1}}, {type: 'BACKGROUND_BLUR', radius: 4}],
    style: {fontFamily: 'Inter', fontWeight: 400, fontSize: 14, textAlignHorizontal: 'RIGHT', textCase: 'UPPER', textDecoration: 'UNDERLINE'}, styleOverrideTable: {'1': {fontWeight: 600}},
  } satisfies DeepPartial<TextNode>;
  const root = parseNodeTree(fixture, parseStyleFacet);
  assert.deepEqual(buildSpec(walkLayers(root, {maxDepth: 5, limit: 300}), parseCatalog({}), {status: 'none-bound'}), {
    layers: [{depth: 0, id: '1-2', type: 'TEXT', name: 'Styled', size: '12.6x24 abs', layout: null, fill: 'solid #FFFFFF80 + linear #000000>#FFFFFF + image bbbbbbbb fit', stroke: '1 inside solid #000000', radius: null, effect: 'drop(0 1 2 0 #0000001A) + bg-blur(4) opacity=0.5', text: 'Inter 400 14/auto align=right case=upper deco=underline mixed'}],
    tokens: [], instances: [], imageFills: 1,
  });
});
for (const field of [{fills: {}}, {fills: [{type: 'SOLID', color: {r: 'bad', g: 0, b: 0, a: 1}}]}, {cornerRadius: '12'}, {layoutMode: 3}, {opacity: false}, {styles: {fill: 4}}, {boundVariables: {itemSpacing: {type: 'VARIABLE_ALIAS', id: 5}}}, {componentProperties: {x: {type: 'BOOLEAN', value: 'yes'}}}])
  test('known style fields reject malformed values: ' + JSON.stringify(field), () => {
    assert.throws(() => parseNodeTree({id: '1:2', name: 'Bad', type: 'INSTANCE', ...field}, parseStyleFacet), (e: unknown) => e instanceof AxiError && e.detail.code === 'bad_response');
  });
test('every numeric cell and evaluated token rounds float32 noise to two decimals without trailing zeros', () => {
  const alias = {type: 'VARIABLE_ALIAS', id: radiusId} as const;
  const fixture = {id: '1:2', type: 'TEXT', name: 'Numbers', characters: 'Text',
    absoluteBoundingBox: {width: 12.600000381469727, height: 16.00000001},
    layoutMode: 'HORIZONTAL', itemSpacing: 8.2000001, paddingTop: 1.2000001, paddingRight: 2.3000001, paddingBottom: 3.4000001, paddingLeft: 4.5000001,
    strokes: [{type: 'SOLID', color: {r: 0, g: 0, b: 0, a: 1}}], strokeWeight: 0.800000011920929,
    rectangleCornerRadii: [1.2000001, 2.3000001, 3.4000001, 4.5000001], opacity: 0.800000011920929,
    effects: [{type: 'DROP_SHADOW', offset: {x: -0.20000000298023224, y: 0.800000011920929}, radius: 16.940000534057617, spread: 0.000001, color: {r: 0, g: 0, b: 0, a: 1}, boundVariables: {radius: alias}}, {type: 'LAYER_BLUR', radius: 2.3000001}],
    style: {fontFamily: 'Inter', fontWeight: 400, fontSize: 16.00000001, lineHeightPx: 16.940000534057617, letterSpacing: -0.20000000298023224},
    boundVariables: {opacity: alias, letterSpacing: [alias], lineHeight: [alias], size: {x: alias}, paddingTop: alias, itemSpacing: alias},
  };
  const spec = buildSpec(walkLayers(parseNodeTree(fixture, parseStyleFacet), {maxDepth: 5, limit: 300}), parseCatalog({}), {status: 'unavailable', figma: null});
  assert.deepEqual(spec.layers, [{depth: 0, id: '1-2', type: 'TEXT', name: 'Numbers',
    size: '12.6x16 <var.20293d10>', layout: 'row gap=8.2 <var.20293d10> pad=1.2/2.3/3.4/4.5 <var.20293d10> main=start cross=start',
    fill: null, stroke: '0.8 inside solid #000000', radius: '1.2/2.3/3.4/4.5',
    effect: 'drop(-0.2 0.8 16.94 0 #000000) <var.20293d10> + blur(2.3) opacity=0.8 <var.20293d10>',
    text: 'Inter 400 16/16.94 ls=-0.2 <var.20293d10>',
  }]);
  assert.equal(spec.tokens[0]?.value, '12.6 / 8.2 / 1.2 / 16.94 / 0.8 / -0.2');
});
test('sizing cells never invent a missing axis', () => {
  const fixture = {id: '1:2', type: 'FRAME', name: 'Partial sizing', absoluteBoundingBox: {width: 10, height: 20}, layoutSizingHorizontal: 'FIXED'} satisfies DeepPartial<FrameNode>;
  assert.equal(buildSpec(walkLayers(parseNodeTree(fixture, parseStyleFacet), {maxDepth: 5, limit: 300}), parseCatalog({}), {status: 'none-bound'}).layers[0]?.size, '10x20');
});
test('nonuniform corners preserve all four values and explicit zeros', () => {
  const fixture = {id: '1:2', type: 'FRAME', name: 'Corners', rectangleCornerRadii: [8, 0, 0, 0], strokes: [{type: 'SOLID', color: {r: 0, g: 0, b: 0, a: 1}}], individualStrokeWeights: {top: 1, right: 0, bottom: 0, left: 0}} satisfies DeepPartial<FrameNode>;
  const row = buildSpec(walkLayers(parseNodeTree(fixture, parseStyleFacet), {maxDepth: 5, limit: 300}), parseCatalog({}), {status: 'none-bound'}).layers[0];
  assert.equal(row?.radius, '8/0/0/0');
  assert.equal(row?.stroke, '1/0/0/0 inside solid #000000');
});
test('local ids and colliding library prefixes remain traceable; repeated uses count layers not aliases', () => {
  const a = 'VariableID:aaaaaaaa1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/1:1';
  const b = 'VariableID:aaaaaaaa2aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/1:2';
  const fixture = {id: '1:2', name: 'Bindings', type: 'FRAME', layoutMode: 'HORIZONTAL', itemSpacing: 8, paddingTop: 8, paddingRight: 8, paddingBottom: 8, paddingLeft: 8,
    boundVariables: {itemSpacing: {type: 'VARIABLE_ALIAS', id: a}, paddingTop: {type: 'VARIABLE_ALIAS', id: a}, paddingRight: {type: 'VARIABLE_ALIAS', id: b}},
    children: [{id: '1:3', name: 'Child', type: 'FRAME', cornerRadius: 8, boundVariables: {topLeftRadius: {type: 'VARIABLE_ALIAS', id: a}, opacity: {type: 'VARIABLE_ALIAS', id: 'VariableID:4:5'}}, opacity: 0.5}],
  } satisfies DeepPartial<FrameNode>;
  const spec = buildSpec(walkLayers(parseNodeTree(fixture, parseStyleFacet), {maxDepth: 5, limit: 300}), parseCatalog({}), {status: 'unavailable', figma: null});
  assert.equal(spec.layers[0]?.layout, 'row gap=8 <var.aaaaaaaa1> pad=8 <var.aaaaaaaa1> <var.aaaaaaaa2> main=start cross=start');
  assert.deepEqual(spec.tokens, [
    {label: 'var.aaaaaaaa1', source: 'variable', id: a, value: '8', fields: 'gap/padding/radius', uses: 2, code: null},
    {label: 'var.aaaaaaaa2', source: 'variable', id: b, value: '8', fields: 'padding', uses: 1, code: null},
    {label: 'var.4-5', source: 'variable', id: 'VariableID:4:5', value: '0.5', fields: 'opacity', uses: 1, code: null},
  ]);
});
test('text bindings preserve evaluated line height and font values while mixed styles are marked', () => {
  const fontId = 'VariableID:244c4a44d5e65918f796a64e03c5d3d9ea4435cd/11:3';
  const fixture = {id: '1:2', type: 'TEXT', name: 'Type', characters: 'Text', style: {fontFamily: 'Inter', fontWeight: 600, fontSize: 18, lineHeightPx: 24, boundVariables: {fontFamily: {type: 'VARIABLE_ALIAS', id: fontId}}}, boundVariables: {fontFamily: [{type: 'VARIABLE_ALIAS', id: fontId}], lineHeight: [{type: 'VARIABLE_ALIAS', id: radiusId}]}, styles: {text: '41:1'}} satisfies DeepPartial<TextNode>;
  const spec = buildSpec(walkLayers(parseNodeTree(fixture, parseStyleFacet), {maxDepth: 5, limit: 300}), parseCatalog({styles: {'41:1': {key: '7ab8eea11bcecb46f201dfdbb6b75b07a9c6feeb', name: 'Type/Heading/Large', styleType: 'TEXT'}}}), {status: 'unavailable', figma: null});
  assert.equal(spec.layers[0]?.text, 'Inter <var.244c4a44> 600 18/24 <Type/Heading/Large> <var.20293d10>');
  assert.deepEqual(spec.tokens.map(t => [t.label, t.value]), [['var.244c4a44', 'Inter'], ['Type/Heading/Large', 'Inter 600 18/24'], ['var.20293d10', '24']]);
});
test('duplicate names across collections qualify; unmatched ids retain fallback labels', () => {
  const sameName = {...variableNames, meta: {...variableNames.meta, variables: {
    [colorId]: {...variableNames.meta.variables[colorId], name: 'same'},
    [radiusId]: {...variableNames.meta.variables[radiusId], name: 'same', variableCollectionId: 'other'},
  }, variableCollections: {col: {name: 'Colors'}, other: {name: 'Dimensions'}}}};
  const spec = buildSpec(walk(), parseCatalog(entry), parseVariableNames(sameName));
  assert.equal(spec.layers[0]?.fill, 'solid #FFFFFF <Colors/Neutral/White> <Colors/same>');
  assert.equal(spec.layers[0]?.radius, '12 <Dimensions/same>');
  const partial = {...variableNames, meta: {...variableNames.meta, variables: {[colorId]: variableNames.meta.variables[colorId]}}};
  assert.equal(buildSpec(walk(), parseCatalog(entry), parseVariableNames(partial)).layers[0]?.radius, '12 <var.20293d10>');
});
test('nested effect bindings retain resolved sub-values, aggregates remain null; unknown kinds print their type', () => {
  const fixture = {id: '1:2', name: 'Effects', type: 'FRAME', effects: [{type: 'DROP_SHADOW', offset: {x: 1, y: 2}, radius: 3, spread: 4, color: {r: 0, g: 0, b: 0, a: 1}, boundVariables: {radius: {type: 'VARIABLE_ALIAS', id: radiusId}}}], boundVariables: {effects: [{type: 'VARIABLE_ALIAS', id: colorId}]}} satisfies DeepPartial<FrameNode>;
  const spec = buildSpec(walkLayers(parseNodeTree(fixture, parseStyleFacet), {maxDepth: 5, limit: 300}), parseCatalog({}), {status: 'unavailable', figma: null});
  assert.equal(spec.layers[0]?.effect, 'drop(1 2 3 4 #000000) <var.20293d10> <var.becc5963>');
  assert.deepEqual(spec.tokens.map(t => [t.value, t.fields]), [['3', 'effect'], [null, 'effect']]);
  const future = parseNodeTree({id: '1:2', name: 'Future', type: 'FRAME', fills: [{type: 'FUTURE_PAINT'}], effects: [{type: 'FUTURE_EFFECT'}]}, parseStyleFacet);
  const row = buildSpec(walkLayers(future, {maxDepth: 5, limit: 300}), parseCatalog({}), {status: 'none-bound'}).layers[0];
  assert.equal(row?.fill, 'FUTURE_PAINT');
  assert.equal(row?.effect, 'FUTURE_EFFECT');
});
test('swap values use the same set, component name, and id fallbacks as instance components', () => {
  const root = parseNodeTree({id: '1:2', type: 'INSTANCE', name: 'Button', componentId: '20:1', componentProperties: {
    Icon: {type: 'INSTANCE_SWAP', value: '20:1'}, Standalone: {type: 'INSTANCE_SWAP', value: '20:2'},
    MissingSet: {type: 'INSTANCE_SWAP', value: '20:3'}, Unknown: {type: 'INSTANCE_SWAP', value: '20:4'},
  }}, parseStyleFacet);
  const catalog = parseCatalog({components: {
    '20:1': {name: 'Size=Sm, Style=Outline', componentSetId: '21:1'},
    '20:2': {name: 'arrow-right'}, '20:3': {name: 'fallback-icon', componentSetId: '21:3'},
  }, componentSets: {'21:1': {name: 'Icon'}}});
  assert.deepEqual(buildSpec(walkLayers(root, {maxDepth: 5, limit: 300}), catalog, {status: 'none-bound'}).instances,
    [{id: '1-2', component: 'Icon', variant: null, props: 'Icon=Icon;Standalone=arrow-right;MissingSet=fallback-icon;Unknown=20:4'}]);
});
test('property name suffix collisions and unmapped instance swaps keep identities; variants are not inferred from names', () => {
  const root = parseNodeTree({id: '1:2', type: 'INSTANCE', name: 'Size=Md', componentId: '20:1', componentProperties: {'Label#1:1': {type: 'TEXT', value: 'A'}, 'Label#2:2': {type: 'TEXT', value: 'B'}, Icon: {type: 'INSTANCE_SWAP', value: '20:9'}}}, parseStyleFacet);
  assert.deepEqual(buildSpec(walkLayers(root, {maxDepth: 5, limit: 300}), parseCatalog({components: {'20:1': {name: 'Size=Md'}}}), {status: 'none-bound'}).instances, [{id: '1-2', component: 'Size=Md', variant: null, props: 'Label#1:1=A;Label#2:2=B;Icon=20:9'}]);
});
for (const raw of [{meta: {}}, {...variableNames, error: true}, {...variableNames, meta: {...variableNames.meta, variables: {x: {...variableNames.meta.variables[colorId], key: 'bad'}}}}])
  test('malformed variable enrichment is not downgraded: ' + JSON.stringify(raw), () => assert.throws(() => parseVariableNames(raw), (e: unknown) => e instanceof AxiError && e.detail.code === 'bad_response'));
test('conflicting exact variable identities reject ambiguous naming', () => {
  assert.throws(() => parseVariableNames({...variableNames, meta: {...variableNames.meta, variables: {a: variableNames.meta.variables[colorId], b: {...variableNames.meta.variables[colorId], name: 'different'}}}}), (e: unknown) => e instanceof AxiError && e.detail.code === 'bad_response');
});
test('selected rows alone contribute bindings; root instances expand and limits/depth are shared', () => {
  const limited = walkLayers(parseNodeTree(entry.document, parseStyleFacet), {maxDepth: 5, limit: 1});
  assert.deepEqual(buildSpec(limited, parseCatalog(entry), {status: 'unavailable', figma: null}).layers, [unavailableSpec.layers[0]]);
  const instance = parseNodeTree({...entry.document.children[0], children: [entry.document.children[1]]}, parseStyleFacet);
  assert.deepEqual(walkLayers(instance, {maxDepth: 1, limit: 300}).visits.map(v => [v.depth, v.node.id]), [[0, '1:3'], [1, '1:4']]);
});
