#!/usr/bin/env node
// Build step (runs after `tsup`): assemble the global-skills payload shipped inside the
// published CLI so `vybekiit setup` / `vybekiit global-install` can copy skills into a
// buyer's ~/.claude/skills with no network and no license gate.
//
// The npm package ships only `dist/` (files: ["dist"]), and the @vybekiit/* template
// packages are private, so the skills have to be materialised into dist at build time.
// We take the UNION of every surface's skills (deduped by skill name — web wins ties),
// giving the buyer every VybeKiit skill in every project.
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = join(HERE, '..');
const REPO_ROOT = join(CLI_ROOT, '..');
const OUT_DIR = join(CLI_ROOT, 'dist', 'global-skills');

// Surface priority: the first surface that defines a skill name wins. `web` is the
// richest surface, so it is canonical; the rest only contribute skills web lacks.
const SURFACE_PRIORITY = ['web', 'mobile', 'backend', 'extension', 'spa'];
const REQUIRED_SKILLS = ['feedback'];

/**
 * List immediate subdirectory names of a directory, or [] when it is absent.
 *
 * @param {string} dir - Directory to read.
 * @returns {Promise<string[]>} Subdirectory names.
 */
const listDirs = async (dir) => {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return [];
  }
};

const main = async () => {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const seen = new Set();
  const manifest = [];

  for (const surface of SURFACE_PRIORITY) {
    const skillsRoot = join(REPO_ROOT, 'templates', surface, '.agents', 'skills');
    for (const name of await listDirs(skillsRoot)) {
      if (seen.has(name)) {
        continue;
      }
      seen.add(name);
      await cp(join(skillsRoot, name), join(OUT_DIR, name), { recursive: true });
      manifest.push(name);
    }
  }

  manifest.sort((left, right) => left.localeCompare(right));
  for (const requiredSkill of REQUIRED_SKILLS) {
    if (!manifest.includes(requiredSkill)) {
      throw new Error(`required global skill is missing: ${requiredSkill}`);
    }
  }
  await writeFile(
    join(OUT_DIR, 'manifest.json'),
    `${JSON.stringify({ skills: manifest, count: manifest.length }, null, 2)}\n`,
    'utf8',
  );

  process.stdout.write(
    `global-skills: bundled ${manifest.length} skills into dist/global-skills\n`,
  );
};

await main();
