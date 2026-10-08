import test from 'node:test';
import assert from 'node:assert/strict';
import {parseNodeTree, parseComponentNames, summarize} from '../summarize.ts';
import {AxiError} from '../errors.ts';
const options = {maxDepth: 5, limit: 300, textMax: 200, componentNames: new Map<string, string>()};
const leaf = (id: string, type = 'RECTANGLE') => ({id, type, name: type});
const tree = (children: unknown[]) => ({id: '1:2', type: 'FRAME', name: 'Root', children});
const rootRow = {depth: 0, id: '1-2', type: 'FRAME', name: 'Root', size: null, content: null};
const counts = {hidden: 0, shapesOmitted: 0, beyondLimit: 0, textsTruncated: 0};
test('depth-first rows, rounded size, sanitized strings and unknown leaf', () => {
  const result = summarize(parseNodeTree(tree([
    {id: '1:3', type: 'FRAME', name: '\x1b[31mChild\nframe', absoluteBoundingBox: {width: 12.6, height: 4.4}, children: [
      {id: '1:4', type: 'TEXT', name: 'Text', characters: 'Hello\tworld'},
    ]},
    {id: '1:5', type: 'FUTURE', name: 'Future', children: [leaf('1:6')]},
  ])), options);
  assert.deepEqual(result, {rows: [rootRow,
    {depth: 1, id: '1-3', type: 'FRAME', name: 'Child frame', size: '13x4', content: null},
    {depth: 2, id: '1-4', type: 'TEXT', name: 'Text', size: null, content: 'Hello world'},
    {depth: 1, id: '1-5', type: 'FUTURE', name: 'Future', size: null, content: null},
  ], counts, depthCutPossible: false});
});
test('null bounding boxes produce literal rows with null size', () => {
  assert.deepEqual(summarize(parseNodeTree(tree([
    {...leaf('1:3'), absoluteBoundingBox: null},
  ])), options), {rows: [
    {depth: 0, id: '1-2', type: 'FRAME', name: 'Root', size: null, content: null},
    {depth: 1, id: '1-3', type: 'RECTANGLE', name: 'RECTANGLE', size: null, content: null},
  ], counts: {hidden: 0, shapesOmitted: 0, beyondLimit: 0, textsTruncated: 0}, depthCutPossible: false});
});
test('hidden subtree roots and every shape type are counted, rectangles retained', () => {
  const result = summarize(parseNodeTree(tree([
    { ...leaf('2:1', 'FRAME'), visible: false, children: [{...leaf('2:2'), visible: false}]},
    ...['VECTOR', 'BOOLEAN_OPERATION', 'ELLIPSE', 'LINE', 'STAR', 'REGULAR_POLYGON'].map((type, i) => leaf('3:' + i, type)),
    leaf('4:1'),
  ])), options);
  assert.deepEqual(result, {rows: [rootRow, {depth: 1, id: '4-1', type: 'RECTANGLE', name: 'RECTANGLE', size: null, content: null}],
    counts: {...counts, hidden: 1, shapesOmitted: 6}, depthCutPossible: false});
});
test('non-root instance collapses visible descendant texts and main component name', () => {
  const result = summarize(parseNodeTree(tree([
    {id: '1:3', type: 'INSTANCE', name: 'Button', componentId: '8:1', children: [
      {id: '2:1', type: 'FRAME', name: 'Wrapper', children: [{id: '2:2', type: 'TEXT', name: 'Label', characters: 'Go'}]},
      {id: '2:3', type: 'FRAME', name: 'Hidden', visible: false, children: [{id: '2:4', type: 'TEXT', name: 'Label', characters: 'No'}]},
    ]},
    {id: '1:4', type: 'INSTANCE', name: 'Unmapped'},
  ])), {...options, componentNames: parseComponentNames({'8:1': {name: '\x1b[31mButton/Primary'}})});
  assert.deepEqual(result, {rows: [rootRow,
    {depth: 1, id: '1-3', type: 'INSTANCE', name: 'Button', size: null, content: 'Button/Primary | Go'},
    {depth: 1, id: '1-4', type: 'INSTANCE', name: 'Unmapped', size: null, content: null},
  ], counts: {...counts, hidden: 1}, depthCutPossible: false});
});
test('root instance exposes its children', () => {
  assert.deepEqual(summarize(parseNodeTree({id: '1:2', type: 'INSTANCE', name: 'Root', children: [leaf('1:3')]}), options),
    {rows: [{...rootRow, type: 'INSTANCE'}, {depth: 1, id: '1-3', type: 'RECTANGLE', name: 'RECTANGLE', size: null, content: null}], counts, depthCutPossible: false});
});
test('text truncation, row limits and full options have literal counts', () => {
  const raw = parseNodeTree(tree([{id: '1:3', type: 'TEXT', name: 'Long', characters: 'abcde'}, leaf('1:4')]));
  assert.deepEqual(summarize(raw, {...options, limit: 2, textMax: 3}), {rows: [rootRow,
    {depth: 1, id: '1-3', type: 'TEXT', name: 'Long', size: null, content: 'abc'},
  ], counts: {...counts, beyondLimit: 1, textsTruncated: 1}, depthCutPossible: false});
  assert.deepEqual(summarize(raw, {...options, limit: null, textMax: null}), {rows: [rootRow,
    {depth: 1, id: '1-3', type: 'TEXT', name: 'Long', size: null, content: 'abcde'},
    {depth: 1, id: '1-4', type: 'RECTANGLE', name: 'RECTANGLE', size: null, content: null},
  ], counts, depthCutPossible: false});
});
test('only emitted containers at the depth bound imply more layers', () => {
  const raw = parseNodeTree(tree([{...leaf('1:3', 'FRAME'), children: [leaf('1:4')]}]));
  assert.deepEqual(summarize(raw, {...options, maxDepth: 1}), {rows: [rootRow,
    {depth: 1, id: '1-3', type: 'FRAME', name: 'FRAME', size: null, content: null},
  ], counts, depthCutPossible: true});
  assert.deepEqual(summarize(parseNodeTree(tree([leaf('1:3')])), {...options, maxDepth: 1}),
    {rows: [rootRow, {depth: 1, id: '1-3', type: 'RECTANGLE', name: 'RECTANGLE', size: null, content: null}], counts, depthCutPossible: false});
  assert.deepEqual(summarize(raw, {...options, maxDepth: 1, limit: 1}),
    {rows: [rootRow], counts: {...counts, beyondLimit: 1}, depthCutPossible: false});
});
test('document is omitted; pages start at depth zero', () => {
  assert.deepEqual(summarize(parseNodeTree({id: '0:0', type: 'DOCUMENT', name: 'Doc', children: [
    {id: '0:1', type: 'CANVAS', name: 'Page', children: [leaf('1:3')]},
  ]}), {...options, maxDepth: 1}), {rows: [
    {depth: 0, id: '0-1', type: 'CANVAS', name: 'Page', size: null, content: null},
    {depth: 1, id: '1-3', type: 'RECTANGLE', name: 'RECTANGLE', size: null, content: null},
  ], counts, depthCutPossible: false});
});
for (const raw of [null, [], {}, {...leaf('not-an-id')}, {...leaf('1:3'), name: 5}, {...leaf('1:3'), visible: 'false'},
  {...leaf('1:3'), children: {}}, {...leaf('1:3'), absoluteBoundingBox: {width: 2, height: '3'}},
  {...leaf('1:3'), characters: 42}, {...leaf('1:3'), componentId: 42}, tree([{}])])
  test('malformed node boundary rejects ' + JSON.stringify(raw), () => {
    assert.throws(() => parseNodeTree(raw), (error: unknown) => error instanceof AxiError && error.detail.code === 'bad_response');
  });
test('component map boundary rejects malformed metadata', () => {
  assert.throws(() => parseComponentNames({'8:1': {name: 7}}), (e: unknown) => e instanceof AxiError && e.detail.code === 'bad_response');
  assert.deepEqual([...parseComponentNames({'8:1': {name: 'Button'}})], [['8:1', 'Button']]);
});
