#!/usr/bin/env node
// Pin official upstream platform skills into each template (ADR-0007).
// Merges platform-skills-base.manifest.json with per-template overrides, then runs skills CLI.

import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const TEMPLATES = ['web', 'mobile', 'extension', 'backend'];
const BASE_MANIFEST_PATH = join(
  REPO_ROOT,
  'packages/agent-kit/src/catalogs/platform-skills-base.manifest.json',
);

/**
 * @typedef {{ repo: string, skills: string[] }} ManifestSource
 * @typedef {{ sources: ManifestSource[], _notes?: Record<string, string> }} PlatformSkillsManifest
 */

/**
 * @param {string[]} argv
 * @returns {{ dryRun: boolean, templates: string[] }}
 */
function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const requested = argv.filter((arg) => !arg.startsWith('--'));
  const unknown = requested.filter((t) => !TEMPLATES.includes(t));
  if (unknown.length > 0) {
    throw new Error(`Unknown template(s): ${unknown.join(', ')}. Known: ${TEMPLATES.join(', ')}`);
  }
  return { dryRun, templates: requested.length > 0 ? requested : [...TEMPLATES] };
}

/**
 * @param {string} path
 * @returns {Promise<PlatformSkillsManifest>}
 */
async function readManifest(path) {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
}

/**
 * @param {ManifestSource[]} a
 * @param {ManifestSource[]} b
 * @returns {ManifestSource[]}
 */
function mergeSkillLists(a, b) {
  const merged = new Set([...a, ...b]);
  if (merged.has('*')) return ['*'];
  return [...merged];
}

/**
 * @param {PlatformSkillsManifest} base
 * @param {PlatformSkillsManifest} template
 * @returns {PlatformSkillsManifest}
 */
function mergeManifests(base, template) {
  /** @type {Map<string, ManifestSource>} */
  const byRepo = new Map();
  for (const source of base.sources ?? []) {
    byRepo.set(source.repo, { repo: source.repo, skills: [...source.skills] });
  }
  for (const source of template.sources ?? []) {
    const existing = byRepo.get(source.repo);
    if (existing) {
      byRepo.set(source.repo, {
        repo: source.repo,
        skills: mergeSkillLists(existing.skills, source.skills),
      });
    } else {
      byRepo.set(source.repo, { repo: source.repo, skills: [...source.skills] });
    }
  }
  return { sources: [...byRepo.values()] };
}

/**
 * @param {string} templateDir
 * @param {ManifestSource} source
 * @param {boolean} dryRun
 */
async function pinSource(templateDir, source, dryRun) {
  if (source.skills.length === 0) {
    return;
  }
  const skillArgs = source.skills.flatMap((skill) => ['--skill', skill]);
  const cmd = ['skills', 'add', source.repo, ...skillArgs, '-y'];
  if (dryRun) {
    console.log(`[dry-run] ${templateDir}: npx ${cmd.join(' ')}`);
    return;
  }
  await execFileAsync('npx', cmd, { cwd: templateDir, env: process.env });
}

/**
 * @param {string} template
 * @param {boolean} dryRun
 */
async function pinTemplate(template, dryRun) {
  const templateDir = join(REPO_ROOT, 'templates', template);
  await access(templateDir);
  const base = await readManifest(BASE_MANIFEST_PATH);
  const templatePath = join(templateDir, 'platform-skills.manifest.json');
  const local = await readManifest(templatePath);
  const merged = mergeManifests(base, local);
  for (const source of merged.sources) {
    await pinSource(templateDir, source, dryRun);
  }
}

async function main() {
  const { dryRun, templates } = parseArgs(process.argv.slice(2));
  const failed = [];
  for (const template of templates) {
    try {
      await pinTemplate(template, dryRun);
    } catch (error) {
      const _message = error instanceof Error ? error.message : String(error);
      console.error(`pin-platform-skills: ${template} failed — ${_message}`);
      failed.push(template);
    }
  }
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main();
