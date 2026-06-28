import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface ManifestSource {
  readonly repo: string;
  readonly skills: string[];
}

interface PlatformSkillsManifest {
  readonly sources: ManifestSource[];
}

export interface PlatformSkillsReport {
  readonly ok: boolean;
  readonly missing: readonly string[];
  readonly template: string | null;
}

/** Detect which VybeKiit template cwd is (web / mobile / extension). */
export function detectTemplate(cwd: string): string | null {
  if (existsSync(join(cwd, 'platform-skills.manifest.json'))) {
    if (existsSync(join(cwd, 'app.json'))) return 'mobile';
    if (existsSync(join(cwd, 'wxt.config.ts')) || existsSync(join(cwd, 'extension.config.ts'))) {
      return 'extension';
    }
    return 'web';
  }
  return null;
}

function readManifest(cwd: string): PlatformSkillsManifest | null {
  const path = join(cwd, 'platform-skills.manifest.json');
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, 'utf8')) as PlatformSkillsManifest;
}

/** List skill folder names expected from the manifest. */
export function expectedSkillNames(manifest: PlatformSkillsManifest): string[] {
  const names = new Set<string>();
  for (const source of manifest.sources) {
    for (const skill of source.skills) {
      if (skill === '*') {
        continue;
      }
      names.add(skill);
    }
  }
  return [...names];
}

/**
 * Verify pinned platform skills exist under `.agents/skills/<name>/SKILL.md`.
 * Pure — no network, no install (the agent runs `npx skills add` when missing).
 */
export function verifyPlatformSkills(cwd: string): PlatformSkillsReport {
  const manifest = readManifest(cwd);
  if (!manifest) {
    return { ok: true, missing: [], template: null };
  }

  const missing: string[] = [];
  for (const name of expectedSkillNames(manifest)) {
    const skillPath = join(cwd, '.agents', 'skills', name, 'SKILL.md');
    if (!existsSync(skillPath)) {
      missing.push(name);
    }
  }

  return {
    ok: missing.length === 0,
    missing,
    template: detectTemplate(cwd),
  };
}

/** Plain-language lines for the doctor report. */
export function formatPlatformSkillsReport(report: PlatformSkillsReport): string[] {
  if (report.template === null) {
    return [];
  }
  if (report.ok) {
    return ['✓ platform skills — all official skills are present.'];
  }
  return [
    `→ platform skills — missing: ${report.missing.join(', ')}. Ask your agent to refresh platform skills (update-kit) or run the pin script.`,
  ];
}
