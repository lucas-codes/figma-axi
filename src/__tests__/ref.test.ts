import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRef, requireNode, urlForm} from '../ref.ts';
import {run} from './harness.ts';
import {route} from '../registry.ts';
import {parseArgs} from '../args.ts';
for (const kind of ['design', 'file', 'proto', 'board']) test('parse ' + kind + ' URL and normalize node id', () => {
  const ref = requireNode(parseRef('https://www.figma.com/' + kind + '/AbC123xyz456/X?node-id=1-2', undefined), 'inspect');
  assert.equal(ref.fileKey, 'AbC123xyz456');
  assert.equal(ref.nodeId, '1:2');
  assert.equal(urlForm(ref.nodeId), '1-2');
});
test('branch key, schemeless URL, instance ids and node override', () => {
  assert.deepEqual(parseRef('figma.com/design/Base123/branch/Branch456/X?node-id=1-2', 'I5:6;7:8'), {kind: 'node', fileKey: 'Branch456', nodeId: 'I5:6;7:8'});
  assert.deepEqual(parseRef('www.figma.com/file/AbC123/X', undefined), {kind: 'file', fileKey: 'AbC123'});
  assert.deepEqual(parseRef('AbC123', undefined), {kind: 'file', fileKey: 'AbC123'});
});
for (const input of ['https://evil.test/design/AbC123/X', 'http://figma.com/design/AbC123', 'https://figma.com@evil.test/design/AbC123',
  'https://u@figma.com/design/AbC123', 'https://figma.com:444/design/AbC123', 'https://figma.com/foo/AbC123', 'https://figma.com/design/a%2Fb', '../key',
  'https://figma.com/design/AbC123#node-id=1-2', 'https://figma.com/design/Base/branch/', ' AbC123', 'https://figma.com/design/AbC123?node-id=x'])
  test('reject reference ' + input, () => assert.throws(() => parseRef(input, undefined), {detail: {code: 'usage'}}));
test('bare URLs select the right command and flag contract; bare keys never route', async () => {
  for (const [url, command] of [
    ['https://www.figma.com/design/AbC123xyz456/X?node-id=1-2', 'inspect'],
    ['https://www.figma.com/design/AbC123xyz456/X', 'outline'],
  ]) {
    assert.deepEqual(route(parseArgs([url!])), {name: command, positional: url});
    const result = await run([url!, '--bogus']);
    assert.equal(result.exit, 2);
    assert.match(result.output, new RegExp('figma-axi ' + command + ' --help'));
    assert.match(result.output, /code: usage/);
  }
  const key = await run(['AbC123xyz456']);
  assert.equal(key.exit, 2);
  assert.match(key.output, /Unknown command/);
});
