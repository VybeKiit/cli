#!/usr/bin/env node
/**
 * Smoke-test: buyer stubs + per-agent symlinks resolve for every buyer template.
 * Structural stand-in for manual Cursor / Claude / Codex picker checks.
 *
 * L1 automated gate — see docs/agent-skill-discovery.md for L2 manual smokes.
 */
import { lstat, readdir, readFile, readlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const repoRoot = repoRootFrom(import.meta.url);
const templates = ['web', 'mobile', 'extension', 'backend'];
const SYMLINKS = [
  { link: '.claude/skills', target: '../.agents/skills' },
  { link: '.cursor/skills', target: '../.agents/skills' },
];
const STUB_MARKER = 'vybekiit:generated:buyer-skill-stub';

/** Sample buyer goals every template must expose via Agent Skills stubs. */
const SAMPLE_STEMS = {
  web: ['onboarding', 'setup-payments', 'add-ai'],
  mobile: ['onboarding', 'setup-payments', 'publish-app'],
  extension: ['onboarding', 'setup-payments', 'publish-extension'],
  backend: ['onboarding', 'wire-payments', 'go-live'],
};

// "name: go-live" -> "go-live"
const FRONTMATTER_NAME_PATTERN = /^name:\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*$/m;
// "description: something useful" -> match
const FRONTMATTER_DESCRIPTION_PATTERN = /^description:\s*\S.+$/m;

/**
 * List buyer skill stems from authoring SSOT (`.vybekiit/skills/*.md`).
 *
 * @param {string} cwd - Template root.
 * @returns {Promise<string[]>}
 */
async function listBuyerSkillStems(cwd) {
  const dir = join(cwd, '.vybekiit/skills');
  try {
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

/**
 * @param {string} cwd
 * @param {string} link
 * @param {string} expectedTarget
 */
async function verifySymlink(cwd, link, expectedTarget) {
  const linkPath = join(cwd, link);
  const stat = await lstat(linkPath);
  if (!stat.isSymbolicLink()) {
    throw new Error(`${link} is not a symlink`);
  }
  const target = await readlink(linkPath);
  if (target !== expectedTarget) {
    throw new Error(`${link} → ${target}, expected ${expectedTarget}`);
  }
  const resolved = join(dirname(linkPath), target);
  await lstat(resolved);
}

/**
 * @param {string} body
 * @param {string} stem
 */
function assertSkillFrontmatter(body, stem) {
  if (!body.startsWith('---')) {
    throw new Error(`.agents/skills/${stem}/SKILL.md missing YAML frontmatter`);
  }
  const nameMatch = body.match(FRONTMATTER_NAME_PATTERN);
  if (nameMatch === null || nameMatch[1] !== stem) {
    throw new Error(`stub name mismatch for ${stem}`);
  }
  if (!FRONTMATTER_DESCRIPTION_PATTERN.test(body)) {
    throw new Error(`.agents/skills/${stem}/SKILL.md missing non-empty description`);
  }
}

/**
 * @param {string} cwd
 * @param {string[]} stems
 */
async function verifyBuyerStubs(cwd, stems) {
  if (stems.length === 0) {
    throw new Error('no buyer skills under .vybekiit/skills (expected authoring SSOT)');
  }
  for (const stem of stems) {
    const stubPath = join(cwd, '.agents/skills', stem, 'SKILL.md');
    const body = await readFile(stubPath, 'utf8');
    if (!body.includes(STUB_MARKER)) {
      throw new Error(`missing buyer stub marker in .agents/skills/${stem}/SKILL.md`);
    }
    assertSkillFrontmatter(body, stem);
  }
}

/**
 * @param {string} cwd
 * @param {string[]} buyerStems
 * @param {string[]} samples
 */
async function verifySampleStems(cwd, buyerStems, samples) {
  const buyerSet = new Set(buyerStems);
  for (const stem of samples) {
    if (!buyerSet.has(stem)) {
      throw new Error(`missing sample buyer skill ${stem} under .vybekiit/skills`);
    }
    const stubPath = join(cwd, '.agents/skills', stem, 'SKILL.md');
    await lstat(stubPath);
  }
}

/**
 * Codex reads AGENTS.md natively; project skills live under `.agents/skills`.
 * Require a pointer so a fresh Codex session finds goal skills.
 *
 * @param {string} cwd
 */
async function verifyCodexDiscoveryPointers(cwd) {
  const agents = await readFile(join(cwd, 'AGENTS.md'), 'utf8');
  const claudePath = join(cwd, 'CLAUDE.md');
  let claude = '';
  try {
    claude = await readFile(claudePath, 'utf8');
  } catch {
    // optional if AGENTS alone is enough
  }

  const combined = `${agents}\n${claude}`;
  const hasAgentsSkills = combined.includes('.agents/skills');
  const hasGoalIndex = combined.includes('goal-index');
  const hasVybekiitSkills = combined.includes('.vybekiit/skills') || combined.includes('skills/');

  if (!hasAgentsSkills && !hasGoalIndex && !hasVybekiitSkills) {
    throw new Error(
      'AGENTS.md/CLAUDE.md must mention .agents/skills, goal-index, or buyer skills so Codex can find project skills',
    );
  }

  // Prefer explicit project Agent Skills path when CLAUDE is present (thin pointer pattern).
  if (claude.length > 0 && !claude.includes('goal-index') && !claude.includes('.agents/skills')) {
    throw new Error('CLAUDE.md should point agents at goal-index or .agents/skills');
  }
}

/**
 * @param {string} cwd
 * @param {string[]} buyerStems
 */
async function countPinnedUpstream(cwd, buyerStems) {
  const agentsDir = join(cwd, '.agents/skills');
  const entries = await readdir(agentsDir, { withFileTypes: true });
  const buyerSet = new Set(buyerStems);
  return entries.filter((e) => e.isDirectory() && !buyerSet.has(e.name)).length;
}

let failed = false;

for (const template of templates) {
  const cwd = join(repoRoot, 'templates', template);
  try {
    const stems = await listBuyerSkillStems(cwd);
    for (const { link, target } of SYMLINKS) {
      await verifySymlink(cwd, link, target);
    }
    await verifyBuyerStubs(cwd, stems);
    const samples = SAMPLE_STEMS[template] ?? ['onboarding'];
    await verifySampleStems(cwd, stems, samples);
    await verifyCodexDiscoveryPointers(cwd);
    const pinned = await countPinnedUpstream(cwd, stems);
    console.log(
      `${template}: ${stems.length} buyer stubs, ${pinned} pinned upstream, samples ok, codex pointers ok, symlinks ok`,
    );
  } catch (error) {
    failed = true;
    console.error(`${template}: ${error instanceof Error ? error.message : error}`);
  }
}

process.exit(failed ? 1 : 0);
