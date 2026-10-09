import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {renderSkill} from '../skill.ts';
test('committed skill pins the zero-install command to the package version for releases', () => {
  const skill = readFileSync(new URL('../../skills/figma-axi/SKILL.md', import.meta.url), 'utf8');
  const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  const command = '`npx -y @lucaslim/figma-axi@' + packageJson.version + ' <args>`';
  const line = skill.split('\n').find(line => line.includes(command));
  assert.ok(line, 'SKILL.md must contain ' + command);
  assert.ok(line.includes('<!-- x-release-please-version -->'), 'The pinned command line must carry the release annotation');
});
test('generated skill matches the committed document and check succeeds', () => {
  assert.equal(readFileSync(new URL('../../skills/figma-axi/SKILL.md', import.meta.url), 'utf8'), renderSkill());
  const result = spawnSync(process.execPath, ['src/skill.ts', '--check'], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
