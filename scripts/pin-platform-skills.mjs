#!/usr/bin/env node
// Pin official upstream platform skills into each template (ADR-0007).
// Reads templates/<name>/platform-skills.manifest.json and runs the skills CLI.

import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const TEMPLATES = ['web', 'mobile', 'extension', 'backend'];

/**
 * @typedef {{ repo: string, skills: string[] }} ManifestSource
 * @typedef {{ sources: ManifestSource[] }} PlatformSkillsManifest
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
 * @param {string} templateDir
 * @returns {Promise<PlatformSkillsManifest>}
 */
async function readManifest(templateDir) {
  const path = join(templateDir, 'platform-skills.manifest.json');
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw);
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
  const manifest = await readManifest(templateDir);
  if (manifest.sources?.length === 0) {
    return;
  }
  for (const source of manifest.sources) {
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
      failed.push(template);
    }
  }
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main();
