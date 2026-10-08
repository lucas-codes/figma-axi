import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {run} from './harness.ts';
import {file, outlineModel, goldenCases} from './fixtures/file-depth2.ts';
const url = 'https://api.figma.com/v1/files/AbC123xyz456?depth=2';
test('outline stdout literally matches the TOON golden and JSON model', async () => {
  const scenario = goldenCases.outline;
  const result = await run(scenario.argv, scenario.routes);
  assert.equal(result.exit, 0);
  assert.equal(result.output, readFileSync(new URL('./goldens/outline.txt', import.meta.url), 'utf8') + '\n');
  assert.deepEqual(JSON.parse((await run([...scenario.argv, '--json'], scenario.routes)).output), outlineModel);
  assert.equal(result.calls[0]?.url, url);
});
test('bare URL outlines; node-id is ignored by explicit outline', async () => {
  for (const argv of [['https://www.figma.com/design/AbC123xyz456/Checkout'], ['outline', 'https://www.figma.com/design/AbC123xyz456/Checkout?node-id=1-2']]) {
    const result = await run([...argv, '--json'], {[url]: {body: file}});
    assert.equal(result.exit, 0);
    assert.deepEqual(JSON.parse(result.output), outlineModel);
  }
});
test('limit cut counts dropped rows and offers a larger limit', async () => {
  const result = await run(['outline', 'AbC123xyz456', '--limit', '2', '--json'], {[url]: {body: file}});
  assert.equal(result.exit, 0);
  assert.deepEqual(JSON.parse(result.output), {...outlineModel, beyondLimit: 4, nodes: outlineModel.nodes.slice(0, 2), help: [
    "Run `figma-axi inspect AbC123xyz456 --node 1-2` for a frame's layers and text",
    'Re-run with a larger --limit to include omitted rows; inspect a frame with --full for all fetched layers and text',
  ]});
});
test('outline bounds traversal even if API sends grandchildren; hidden and shapes counted', async () => {
  const body = {...file, document: {id: '0:0', type: 'DOCUMENT', name: 'Document', children: [
    {id: '0:1', type: 'CANVAS', name: 'Page', children: [
      {id: '1:2', type: 'FRAME', name: 'Frame', children: [{id: '1:3', type: 'TEXT', name: 'Deeper', characters: 'No'}]},
      {id: '1:4', type: 'VECTOR', name: 'Shape'},
      {id: '1:5', type: 'FRAME', name: 'Hidden', visible: false},
    ]},
  ]}};
  const result = await run(['outline', 'AbC123xyz456', '--json'], {[url]: {body}});
  assert.equal(result.exit, 0);
  assert.deepEqual(JSON.parse(result.output), {...outlineModel, pages: 1, hidden: 1, shapesOmitted: 1, nodes: [
    {depth: 0, id: '0-1', type: 'CANVAS', name: 'Page', size: null, content: null},
    {depth: 1, id: '1-2', type: 'FRAME', name: 'Frame', size: null, content: null},
  ], help: [outlineModel.help[0]]});
});
for (const body of [{}, {...file, lastModified: 7}, {...file, document: {id: '1:2', type: 'FRAME', name: 'Wrong root'}}, {...file, components: []}])
  test('outline malformed response becomes bad_response ' + JSON.stringify(body).slice(0, 40), async () => {
    const result = await run(['outline', 'AbC123xyz456', '--json'], {[url]: {body}});
    assert.equal(result.exit, 1);
    assert.equal(JSON.parse(result.output).code, 'bad_response');
  });
