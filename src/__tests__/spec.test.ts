import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {run, type Reply} from './harness.ts';
import {goldenCases, designFrame, variableNames, unboundFrame, colorId} from './fixtures/design.ts';
const nodesUrl = 'https://api.figma.com/v1/files/AbC123xyz456/nodes?ids=1%3A2&depth=5';
const variablesUrl = 'https://api.figma.com/v1/files/AbC123xyz456/variables/local';
const argv = ['spec', 'AbC123xyz456', '--node', '1-2', '--json'];
for (const [name, scenario] of Object.entries(goldenCases)) test(name + ' produces the literal golden and normalized JSON', async () => {
  const toon = await run(scenario.argv, scenario.routes);
  assert.equal(toon.exit, 0);
  assert.equal(toon.output, readFileSync(new URL('./goldens/' + name + '.txt', import.meta.url), 'utf8') + '\n');
  const json = await run([...scenario.argv, '--json'], scenario.routes);
  assert.equal(json.exit, 0);
  assert.deepEqual(JSON.parse(json.output), scenario.model);
  assert.deepEqual(json.calls.map(call => call.url), name === 'spec-none-bound' ? [nodesUrl] : [nodesUrl, variablesUrl]);
});
for (const [status, code] of [[401, 'unauthorized'], [404, 'not_found'], [429, 'rate_limited'], [500, 'http_error']] as const)
  test('variable enrichment ' + status + ' remains an error', async () => {
    const result = await run(argv, {[nodesUrl]: {body: designFrame}, [variablesUrl]: {status, body: {message: 'Refused'}}});
    assert.equal(result.exit, 1);
    assert.equal(JSON.parse(result.output).code, code);
  });
test('a nodes 403 is not a naming downgrade', async () => {
  const result = await run(argv, {[nodesUrl]: {status: 403, body: {message: 'Invalid scope(s)'}}});
  assert.equal(result.exit, 1);
  assert.deepEqual(JSON.parse(result.output), {error: 'Figma refused the request (403)', code: 'forbidden', status: 403, figma: 'Invalid scope(s)', help: ['Check FIGMA_TOKEN has the file_content:read scope']});
});
test('arbitrary forbidden enrichment degrades but malformed successful metadata does not', async () => {
  const forbidden = await run(argv, {[nodesUrl]: {body: designFrame}, [variablesUrl]: {status: 403, body: {message: 'Plan does not allow variables'}}});
  assert.equal(forbidden.exit, 0);
  const model = JSON.parse(forbidden.output);
  assert.equal(model.variableNames, 'unavailable');
  assert.match(model.attention[0], /Plan does not allow variables/);
  const malformed = await run(argv, {[nodesUrl]: {body: designFrame}, [variablesUrl]: {body: {status: 200, error: false, meta: {}}}});
  assert.equal(malformed.exit, 1);
  assert.equal(JSON.parse(malformed.output).code, 'bad_response');
  const transport = await run(argv, {[nodesUrl]: {body: designFrame}});
  assert.equal(transport.exit, 1);
  assert.equal(JSON.parse(transport.output).code, 'transport_error');
});
test('enrichment is selected-row scoped, and limit/depth follow-up help explains cuts', async () => {
  const selected = {...unboundFrame, nodes: {'1:2': {...unboundFrame.nodes['1:2'], document: {...unboundFrame.nodes['1:2'].document, children: [designFrame.nodes['1:2'].document]}}}};
  const limited = await run([...argv, '--limit', '1'], {[nodesUrl]: {body: selected}});
  assert.equal(limited.exit, 0);
  const model = JSON.parse(limited.output);
  assert.equal(model.variableNames, 'none-bound');
  assert.equal(model.beyondLimit, 4);
  assert.match(model.help.at(-1), /larger --limit/);
  assert.deepEqual(limited.calls.map(c => c.url), [nodesUrl]);
  const shallow = await run([...argv, '--depth', '1'], {[nodesUrl.replace('depth=5', 'depth=1')]: {body: designFrame}, [variablesUrl]: {body: variableNames}});
  assert.equal(shallow.exit, 0);
  assert.equal(JSON.parse(shallow.output).instanceLayersSkipped, 0);
  const deepContainer = {...unboundFrame, nodes: {'1:2': {...unboundFrame.nodes['1:2'], document: {...unboundFrame.nodes['1:2'].document, children: [{id: '1:3', type: 'FRAME', name: 'Child'}]}}}};
  const atDepth = await run([...argv, '--depth', '1'], {[nodesUrl.replace('depth=5', 'depth=1')]: {body: deepContainer}});
  assert.equal(atDepth.exit, 0);
  assert.match(JSON.parse(atDepth.output).help.at(-1), /larger --depth/);
});
test('spec needs a node, rejects unsupported flags, and accepts URL node ids with explicit override', async () => {
  const missing = await run(['spec', 'AbC123xyz456', '--json']);
  assert.equal(missing.exit, 2);
  assert.equal(JSON.parse(missing.output).code, 'usage');
  for (const flag of ['--full', '--variables', '--bogus']) {
    const result = await run([...argv, flag]);
    assert.equal(result.exit, 2);
    assert.deepEqual(JSON.parse(result.output).validFlags, ['--node', '--depth', '--limit', '--json']);
  }
  const url = await run(['spec', 'https://www.figma.com/design/AbC123xyz456/Product?node-id=9-9', '--node', '1:2', '--json'], goldenCases['spec-resolved'].routes);
  assert.equal(url.exit, 0);
  assert.equal(JSON.parse(url.output).node, '1-2');
});
for (const child of [
  {id: '1:3', type: 'ELLIPSE', name: 'Photo', fills: [{type: 'IMAGE', imageRef: 'a'.repeat(40)}]},
  {id: '1:3', type: 'INSTANCE', name: 'Collapsed', children: [{id: '1:4', type: 'RECTANGLE', name: 'Photo', fills: [{type: 'IMAGE', imageRef: 'a'.repeat(40)}]}]},
]) test('image count includes omitted shapes and collapsed instance internals: ' + child.type, async () => {
  const body = {name: 'Photos', nodes: {'1:2': {components: {}, document: {id: '1:2', type: 'FRAME', name: 'Frame', children: [child]}}}};
  const result = await run(argv, {[nodesUrl]: {body}});
  assert.equal(result.exit, 0);
  const model = JSON.parse(result.output);
  assert.equal(model.imageFills, 1);
  assert.equal(model.help[0], 'Run `figma-axi assets AbC123xyz456 --node 1-2` to save 1 image fill');
  assert.deepEqual(result.calls.map(c => c.url), [nodesUrl]);
});
test('image count deduplicates refs across all visible subtree nodes, even beyond row limits', async () => {
  const photo = {type: 'IMAGE', imageRef: 'a'.repeat(40)};
  const body = {name: 'Photos', nodes: {'1:2': {components: {}, document: {id: '1:2', type: 'FRAME', name: 'Frame', children: [
    {id: '1:3', type: 'RECTANGLE', name: 'A', fills: [photo]},
    {id: '1:4', type: 'ELLIPSE', name: 'B', fills: [photo]},
    {id: '1:5', type: 'RECTANGLE', name: 'Hidden', visible: false, fills: [{type: 'IMAGE', imageRef: 'b'.repeat(40)}]},
  ]}}}};
  const result = await run([...argv, '--limit', '1'], {[nodesUrl]: {body}});
  assert.equal(result.exit, 0);
  assert.equal(JSON.parse(result.output).imageFills, 1);
  const cut = await run(argv, {[nodesUrl]: {body: {name: 'Photos', nodes: {'1:2': {components: {}, document: {id: '1:2', type: 'FRAME', name: 'Frame'}}}}}});
  assert.equal(cut.exit, 0);
  assert.equal(JSON.parse(cut.output).imageFills, 0);
  assert.deepEqual(cut.calls.map(c => c.url), [nodesUrl]);
});
test('null requested node reports node_not_found', async () => {
  const result = await run(argv, {[nodesUrl]: {body: {name: 'Product', nodes: {'1:2': null}}}});
  assert.equal(result.exit, 1);
  assert.equal(JSON.parse(result.output).code, 'node_not_found');
});
test('new API fields cannot leak a token into spec stdout', async () => {
  for (const body of [
    {...variableNames, meta: {...variableNames.meta, variables: {x: {...variableNames.meta.variables[colorId], name: 'figd_DUMMY_SECRET'}}}},
    {...variableNames, meta: {...variableNames.meta, variables: {x: {id: 'figd_DUMMY_SECRET'}}}},
  ]) {
    const result = await run(argv, {[nodesUrl]: {body: designFrame}, [variablesUrl]: {body}});
    assert.equal(result.exit, 1);
    assert.equal(JSON.parse(result.output).code, 'security');
    assert.equal(result.output.includes('figd_DUMMY_SECRET'), false);
  }
  const routes: Record<string, Reply> = {[nodesUrl]: {body: designFrame}, [variablesUrl]: {body: variableNames}};
  const success = await run(argv, routes);
  assert.equal(success.exit, 0);
  assert.equal(JSON.parse(success.output).variableNames, 'resolved');
});
