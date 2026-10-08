import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('dependency closure is development-only, exact, and has no install scripts', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  for (const key of ['dependencies', 'optionalDependencies', 'peerDependencies']) assert.equal(Object.hasOwn(pkg, key), false);
  assert.deepEqual(pkg.devDependencies, {
    typescript: '5.9.3', '@types/node': '24.13.5', '@toon-format/toon': '4.1.1', '@figma/rest-api-spec': '0.44.0', 'axi-axi': '0.1.0',
  });
  const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
  for (const [name, value] of Object.entries(lock.packages) as [string, {hasInstallScript?: boolean}][]) assert.equal(!!value.hasInstallScript, false, name);
});
