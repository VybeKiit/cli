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

export type PlatformSkillsReport = {
  readonly ok: boolean;
  readonly missing: readonly string[];
  readonly template: string | null;
  readonly lockCount: number;
};

/**
 * Read the platform skills manifest when present.
 *
 * @param cwd - Project directory.
 * @returns Parsed manifest, or null when absent.
 * @example
 * const manifest = readManifest(process.cwd());
 */
const readManifest = (cwd: string): PlatformSkillsManifest | null => {
  const path = join(cwd, 'platform-skills.manifest.json');
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, 'utf8')) as PlatformSkillsManifest;
};

/**
 * Read the pinned skills lock when present.
 *
 * @param cwd - Project directory.
 * @returns Parsed skills lock, or null when absent/unreadable.
 * @example
 * const lock = readSkillsLock(process.cwd());
 */
const readSkillsLock = (cwd: string): SkillsLockFile | null => {
  const path = join(cwd, 'skills-lock.json');
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as SkillsLockFile;
  } catch {
    return null;
  }
};

/**
 * Check if one pinned skill exists on disk.
 *
 * @param cwd - Project directory.
 * @param name - Skill name.
 * @returns True when the skill has a `SKILL.md`.
 * @example
 * const exists = skillFileExists(process.cwd(), 'wrangler');
 */
const skillFileExists = (cwd: string, name: string): boolean =>
  existsSync(join(cwd, '.agents', 'skills', name, 'SKILL.md'));

/**
 * Verify pinned platform skills exist under `.agents/skills/<name>/SKILL.md`.
 * When skills-lock.json exists, every locked skill is verified (not just manifest explicit names).
 *
 * @param cwd - Project directory to inspect.
 * @returns Platform skills verification report.
 * @example
 * const report = verifyPlatformSkills(process.cwd());
 */
export const verifyPlatformSkills = (cwd: string): PlatformSkillsReport => {
  const manifest = readManifest(cwd);
  if (manifest === null) {
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
};

/** Template label for platform-skills report — only when manifest exists. */
const templateLabelForPlatformSkills = (cwd: string): string | null => {
  if (!existsSync(join(cwd, 'platform-skills.manifest.json'))) {
    return null;
  }
  return inferProjectSurfaceSync(cwd).template;
};

/**
 * Format platform skill verification as doctor report lines.
 *
 * @param report - Platform skills verification report.
 * @returns Buyer-readable doctor lines.
 * @example
 * const lines = formatPlatformSkillsReport(report);
 */
export const formatPlatformSkillsReport = (report: PlatformSkillsReport): string[] => {
  if (report.template === null) {
    return [];
  }
  const lines: string[] = [];
  const lockPath = join(process.cwd(), 'skills-lock.json');
  if (existsSync(lockPath)) {
    try {
      const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as SkillsLockFile;
      const count = Object.keys(lock.skills).length;
      lines.push(`✓ platform skills lock - ${count} pinned skill(s) in skills-lock.json.`);
    } catch {
      lines.push('→ platform skills lock - skills-lock.json unreadable.');
    }
  } else {
    lines.push('→ platform skills lock - skills-lock.json missing (run pin-platform-skills).');
  }
  if (report.ok) {
    const scope =
      report.lockCount > 0
        ? `all ${report.lockCount} locked skill(s)`
        : 'all explicit manifest skills';
    lines.push(`✓ platform skills - ${scope} are present.`);
    return lines;
  }
  lines.push(
    `→ platform skills - missing: ${report.missing.join(', ')}. Ask your agent to refresh platform skills (update-kit) or run the pin script.`,
  );
  return lines;
};
