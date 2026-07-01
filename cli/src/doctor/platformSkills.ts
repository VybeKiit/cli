import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import {
  expectedSkillNamesFromLock,
  expectedSkillNamesFromManifest,
  type PlatformSkillsManifest,
  type SkillsLockFile,
} from '@vybekiit/agent-kit';
import { inferProjectSurfaceSync } from '../lib/inferProjectSurface';

export interface PlatformSkillsReport {
  readonly ok: boolean;
  readonly missing: readonly string[];
  readonly template: string | null;
  readonly lockCount: number;
}

function readManifest(cwd: string): PlatformSkillsManifest | null {
  const path = join(cwd, 'platform-skills.manifest.json');
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, 'utf8')) as PlatformSkillsManifest;
}

function readSkillsLock(cwd: string): SkillsLockFile | null {
  const path = join(cwd, 'skills-lock.json');
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as SkillsLockFile;
  } catch {
    return null;
  }
}

function skillFileExists(cwd: string, name: string): boolean {
  return existsSync(join(cwd, '.agents', 'skills', name, 'SKILL.md'));
}

/**
 * Verify pinned platform skills exist under `.agents/skills/<name>/SKILL.md`.
 * When skills-lock.json exists, every locked skill is verified (not just manifest explicit names).
 */
export function verifyPlatformSkills(cwd: string): PlatformSkillsReport {
  const manifest = readManifest(cwd);
  if (!manifest) {
    return { ok: true, missing: [], template: null, lockCount: 0 };
  }

  const lock = readSkillsLock(cwd);
  const lockNames = expectedSkillNamesFromLock(lock);
  const manifestNames = expectedSkillNamesFromManifest(manifest);
  const namesToVerify = lockNames.length > 0 ? lockNames : manifestNames;

  const missing: string[] = [];
  for (const name of namesToVerify) {
    if (!skillFileExists(cwd, name)) {
      missing.push(name);
    }
  }

  return {
    ok: missing.length === 0,
    missing,
    template: templateLabelForPlatformSkills(cwd),
    lockCount: lockNames.length,
  };
}

/** Template label for platform-skills report — only when manifest exists. */
function templateLabelForPlatformSkills(cwd: string): string | null {
  if (!existsSync(join(cwd, 'platform-skills.manifest.json'))) {
    return null;
  }
  return inferProjectSurfaceSync(cwd).template;
}

/** Plain-language lines for the doctor report. */
export function formatPlatformSkillsReport(report: PlatformSkillsReport): string[] {
  if (report.template === null) {
    return [];
  }
  const lines: string[] = [];
  const lockPath = join(process.cwd(), 'skills-lock.json');
  if (existsSync(lockPath)) {
    try {
      const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as SkillsLockFile;
      const count = Object.keys(lock.skills ?? {}).length;
      lines.push(`✓ platform skills lock — ${count} pinned skill(s) in skills-lock.json.`);
    } catch {
      lines.push('→ platform skills lock — skills-lock.json unreadable.');
    }
  } else {
    lines.push('→ platform skills lock — skills-lock.json missing (run pin-platform-skills).');
  }
  if (report.ok) {
    const scope =
      report.lockCount > 0
        ? `all ${report.lockCount} locked skill(s)`
        : 'all explicit manifest skills';
    lines.push(`✓ platform skills — ${scope} are present.`);
    return lines;
  }
  lines.push(
    `→ platform skills — missing: ${report.missing.join(', ')}. Ask your agent to refresh platform skills (update-kit) or run the pin script.`,
  );
  return lines;
}
