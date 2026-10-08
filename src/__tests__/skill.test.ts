import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {renderSkill} from '../skill.ts';
test('generated skill matches the committed document and check succeeds', () => {
  assert.equal(readFileSync(new URL('../../skills/figma-axi/SKILL.md', import.meta.url), 'utf8'), renderSkill());
  const result = spawnSync(process.execPath, ['src/skill.ts', '--check'], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
