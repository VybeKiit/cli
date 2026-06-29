import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ProjectHealthReport {
  readonly ok: boolean;
  readonly lines: readonly string[];
}

function gitignoreCoversEnv(cwd: string): boolean {
  const path = join(cwd, '.gitignore');
  if (!existsSync(path)) {
    return false;
  }
  const content = readFileSync(path, 'utf8');
  return /^\.env/m.test(content) || content.includes('.env\n') || content.includes('.env\r\n');
}

function cursorignoreCoversEnv(cwd: string): boolean {
  const path = join(cwd, '.cursorignore');
  if (!existsSync(path)) {
    return false;
  }
  const content = readFileSync(path, 'utf8');
  return content
    .split('\n')
    .some((line) => line.trim() === '.env' || line.trim().startsWith('.env'));
}

/** Buyer-project checks beyond the global toolchain (secret settings redaction). */
export function verifyProjectHealth(cwd: string): ProjectHealthReport {
  const lines: string[] = [];
  let ok = true;

  if (cursorignoreCoversEnv(cwd)) {
    lines.push('✓ Secret settings file hidden from your assistant (.cursorignore)');
  } else {
    ok = false;
    lines.push(
      '✗ Add `.cursorignore` with `.env` listed — keeps secret values out of your assistant',
    );
  }

  if (gitignoreCoversEnv(cwd)) {
    lines.push('✓ Secret settings file excluded from git (.gitignore)');
  } else {
    ok = false;
    lines.push('✗ `.gitignore` must list `.env` so secrets are never committed');
  }

  return { ok, lines };
}

export function formatProjectHealthReport(report: ProjectHealthReport): readonly string[] {
  return report.lines;
}
