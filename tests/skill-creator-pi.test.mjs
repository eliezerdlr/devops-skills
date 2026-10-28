import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, registeredSkillFiles, skillResourceCount } from './package-contract.mjs';

// Existing SDK only; these are discovery/formatting checks, not model evaluations.
const sdkRoot = process.env.PI_SDK_ROOT;
if (!sdkRoot) throw new Error('Set PI_SDK_ROOT to the installed Pi SDK (creator verified on 1.4.0)');
const { loadSkills, formatSkillsForPrompt } = await import(pathToFileURL(resolve(sdkRoot, 'dist/core/skills.js')));
const creatorFile = resolve(root, 'skills/engineering-skills/skill-creator/SKILL.md');

test('actual Pi loader accepts skill-creator with a valid authoring description', () => {
  const result = loadSkills({ cwd: root, agentDir: root, skillPaths: [creatorFile], includeDefaults: false });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.skills.length, 1);
  assert.equal(result.skills[0].name, 'skill-creator');
  assert.equal(result.skills[0].filePath, creatorFile);
  assert.equal(result.skills[0].disableModelInvocation, false);
  assert.match(formatSkillsForPrompt(result.skills), /<name>skill-creator<\/name>/);
});

test('creator discovery excludes removed teach while retaining all package skills', async () => {
  const result = loadSkills({ cwd: root, agentDir: root, skillPaths: await registeredSkillFiles(), includeDefaults: false });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.skills.length, skillResourceCount);
  const teach = result.skills.find(s => s.name === 'teach');
  assert.equal(teach, undefined);
  const prompt = formatSkillsForPrompt(result.skills);
  assert.match(prompt, /<name>skill-creator<\/name>/);
  assert.doesNotMatch(prompt, /<name>teach<\/name>/);
  assert.match(prompt, /<name>netbird-remote-access<\/name>/);
});
