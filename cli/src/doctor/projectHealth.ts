import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type ProjectHealthReport = {
  readonly ok: boolean;
  readonly lines: readonly string[];
};

// ".env" at the start of a gitignore line -> env file is ignored.
const GITIGNORE_ENV_LINE_PATTERN = /^\.env/m;

/**
 * Check whether `.gitignore` excludes `.env`.
 *
 * @param cwd - Project directory.
 * @returns True when `.env` is ignored.
 * @example
 * const covered = gitignoreCoversEnv(process.cwd());
 */
const gitignoreCoversEnv = (cwd: string): boolean => {
  const path = join(cwd, '.gitignore');
  if (!existsSync(path)) {
    return false;
  }
  const content = readFileSync(path, 'utf8');
  return (
    GITIGNORE_ENV_LINE_PATTERN.test(content) ||
    content.includes('.env\n') ||
    content.includes('.env\r\n')
  );
};

/**
 * Check whether `.cursorignore` hides `.env` from Cursor.
 *
 * @param cwd - Project directory.
 * @returns True when Cursor ignores `.env`.
 * @example
 * const covered = cursorignoreCoversEnv(process.cwd());
 */
const cursorignoreCoversEnv = (cwd: string): boolean => {
  const path = join(cwd, '.cursorignore');
  if (!existsSync(path)) {
    return false;
  }
  const content = readFileSync(path, 'utf8');
  return content
    .split('\n')
    .some((line) => line.trim() === '.env' || line.trim().startsWith('.env'));
};

/**
 * Verify buyer-project hygiene beyond the global toolchain.
 *
 * @param cwd - Project directory to inspect.
 * @returns Project health report and remediation lines.
 * @example
 * const report = verifyProjectHealth(process.cwd());
 */
export const verifyProjectHealth = (cwd: string): ProjectHealthReport => {
  const lines: string[] = [];
  let ok = true;

  if (cursorignoreCoversEnv(cwd)) {
    lines.push('✓ Secret settings file hidden from your assistant (.cursorignore)');
  } else {
    ok = false;
    lines.push(
      '✗ Add `.cursorignore` with `.env` listed - keeps secret values out of your assistant',
    );
  }

  if (gitignoreCoversEnv(cwd)) {
    lines.push('✓ Secret settings file excluded from git (.gitignore)');
  } else {
    ok = false;
    lines.push('✗ `.gitignore` must list `.env` so secrets are never committed');
  }

  return { ok, lines };
};
