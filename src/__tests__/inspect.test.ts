import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {run} from './harness.ts';
import {frame, inspectModel, goldenCases} from './fixtures/nodes-frame.ts';
const url = (depth = 5) => 'https://api.figma.com/v1/files/AbC123xyz456/nodes?ids=1%3A2&depth=' + depth;
const argv = ['inspect', 'AbC123xyz456', '--node', '1-2'];
test('bare URL inspect stdout is literal TOON golden; JSON identical; API ids are colon form', async () => {
  const scenario = goldenCases.inspect;
  const result = await run(scenario.argv, scenario.routes);
  assert.equal(result.exit, 0);
  assert.equal(result.output, readFileSync(new URL('./goldens/inspect.txt', import.meta.url), 'utf8') + '\n');
  assert.deepEqual(JSON.parse((await run([...scenario.argv, '--json'], scenario.routes)).output), inspectModel);
  assert.equal(new URL(result.calls[0]!.url).searchParams.get('ids'), '1:2');
  assert.deepEqual(JSON.parse((await run([...argv, '--json'], scenario.routes)).output), inspectModel);
});
for (const nodes of [{'1:2': null}, {}])
  test('null or absent requested node is node_not_found', async () => {
    const result = await run([...argv, '--json'], {[url()]: {body: {name: 'Checkout redesign', nodes}}});
    assert.equal(result.exit, 1);
    assert.deepEqual(JSON.parse(result.output), {error: 'Node 1-2 was not found', code: 'node_not_found',
      help: ['Run `figma-axi outline AbC123xyz456` to list frames and their ids']});
  });
test('depth hint only for containers at the limit', async () => {
  const document = {id: '1:2', type: 'FRAME', name: 'Root', children: [{id: '1:6', type: 'FRAME', name: 'Child'}]};
  const body = {name: 'File', nodes: {'1:2': {document, components: {}}}};
  const result = await run([...argv, '--depth', '1', '--json'], {[url(1)]: {body}});
  assert.equal(result.exit, 0);
  const expected = {file: 'File', node: '1-2', depth: 1, hidden: 0, shapesOmitted: 0, beyondLimit: 0, textsTruncated: 0,
    nodes: [{depth: 0, id: '1-2', type: 'FRAME', name: 'Root', size: null, content: null},
      {depth: 1, id: '1-6', type: 'FRAME', name: 'Child', size: null, content: null}],
    help: [...inspectModel.help, 'Container nodes at depth 1 may have more layers; re-run with a larger --depth']};
  assert.deepEqual(JSON.parse(result.output), expected);
  const leafBody = {name: 'File', nodes: {'1:2': {document: {...document, children: [{id: '1:6', type: 'TEXT', name: 'Child', characters: 'Hello'}]}, components: {}}}};
  const leafResult = await run([...argv, '--depth', '1', '--json'], {[url(1)]: {body: leafBody}});
  assert.equal(leafResult.exit, 0);
  assert.deepEqual(JSON.parse(leafResult.output), {...expected, nodes: [expected.nodes[0],
    {depth: 1, id: '1-6', type: 'TEXT', name: 'Child', size: null, content: 'Hello'}], help: [inspectModel.help[0]]});
});
test('--full disables both text and row limits', async () => {
  const body = {name: 'File', nodes: {'1:2': {components: {}, document: {id: '1:2', type: 'FRAME', name: 'Root', children: [
    {id: '1:3', type: 'TEXT', name: 'Long', characters: 'x'.repeat(201)}, {id: '1:4', type: 'RECTANGLE', name: 'Last'},
  ]}}}};
  const normal = await run([...argv, '--limit', '2', '--json'], {[url()]: {body}});
  assert.equal(normal.exit, 0);
  const base = {file: 'File', node: '1-2', depth: 5, hidden: 0, shapesOmitted: 0, beyondLimit: 1, textsTruncated: 1,
    nodes: [{depth: 0, id: '1-2', type: 'FRAME', name: 'Root', size: null, content: null},
      {depth: 1, id: '1-3', type: 'TEXT', name: 'Long', size: null, content: 'x'.repeat(200)}],
    help: [inspectModel.help[0], 'Re-run with a larger --limit or --full to include omitted rows and untruncated text']};
  assert.deepEqual(JSON.parse(normal.output), base);
  const full = await run([...argv, '--limit', '2', '--full', '--json'], {[url()]: {body}});
  assert.equal(full.exit, 0);
  assert.deepEqual(JSON.parse(full.output), {...base, beyondLimit: 0, textsTruncated: 0, nodes: [base.nodes[0],
    {...base.nodes[1], content: 'x'.repeat(201)}, {depth: 1, id: '1-4', type: 'RECTANGLE', name: 'Last', size: null, content: null}],
    help: [inspectModel.help[0]]});
});
test('API strings are sanitized in file, row and instance content', async () => {
  const body = {name: '\x1b[31mFile\nname', nodes: {'1:2': {components: {'8:1': {name: 'Button\tPrimary'}},
    document: {id: '1:2', type: 'FRAME', name: 'Root\tname', children: [{id: '1:3', type: 'INSTANCE', name: 'Button', componentId: '8:1',
      children: [{id: '1:4', type: 'TEXT', name: 'Label', characters: '\x1b[32mGo\nnow'}]}]}}}};
  const result = await run([...argv, '--json'], {[url()]: {body}});
  assert.equal(result.exit, 0);
  assert.deepEqual(JSON.parse(result.output), {file: 'File name', node: '1-2', depth: 5, hidden: 0, shapesOmitted: 0, beyondLimit: 0, textsTruncated: 0,
    nodes: [{depth: 0, id: '1-2', type: 'FRAME', name: 'Root name', size: null, content: null},
      {depth: 1, id: '1-3', type: 'INSTANCE', name: 'Button', size: null, content: 'Button Primary | Go now'}],
    help: [inspectModel.help[0]]});
});
for (const body of [{}, {...frame, name: 4}, {name: 'File', nodes: {'1:2': {document: {}, components: {}}}}, {name: 'File', nodes: {'1:2': {document: frame.nodes['1:2'].document, components: {'8:1': {name: 2}}}}}])
  test('inspect malformed boundary yields bad_response ' + JSON.stringify(body).slice(0, 40), async () => {
    const result = await run([...argv, '--json'], {[url()]: {body}});
    assert.equal(result.exit, 1);
    assert.equal(JSON.parse(result.output).code, 'bad_response');
  });
