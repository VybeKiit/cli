#!/usr/bin/env node
/**
 * Smoke-test: buyer stubs + per-agent symlinks resolve for every buyer template.
 * Structural stand-in for manual Cursor / Claude / Codex picker checks.
 */
import { lstat, readdir, readFile, readlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const templates = ['web', 'mobile', 'extension', 'backend'];
const SYMLINKS = [
  { link: '.claude/skills', target: '../.agents/skills' },
  { link: '.cursor/skills', target: '../.agents/skills' },
];
const STUB_MARKER = 'vybekiit:generated:buyer-skill-stub';

async function listBuyerSkillStems(cwd) {
  const dir = join(cwd, '.vybekiit/skills');
  try {
    const files = await readdir(dir);
    return files.filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
  } catch {
    return [];
  }
}

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

async function verifyBuyerStubs(cwd, stems) {
  for (const stem of stems) {
    const stubPath = join(cwd, '.agents/skills', stem, 'SKILL.md');
    const body = await readFile(stubPath, 'utf8');
    if (!body.includes(STUB_MARKER)) {
      throw new Error(`missing buyer stub marker in .agents/skills/${stem}/SKILL.md`);
    }
    if (!new RegExp(`^name:\\s*${stem}\\s*$`, 'm').test(body)) {
      throw new Error(`stub name mismatch for ${stem}`);
    }
  }
}

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
    const pinned = await countPinnedUpstream(cwd, stems);
    console.log(`${template}: ${stems.length} buyer stubs, ${pinned} pinned upstream, symlinks ok`);
  } catch (error) {
    failed = true;
    console.error(`${template}: ${error instanceof Error ? error.message : error}`);
  }
}

process.exit(failed ? 1 : 0);
