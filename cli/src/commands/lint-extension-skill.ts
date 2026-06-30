import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { lintExtensionSkill, type ExtensionSkillLintKind } from '@vybekiit/agent-kit';

export interface LintExtensionSkillResult {
  readonly json: string;
  readonly exitCode: number;
}

function inferKind(path: string, explicit?: string): ExtensionSkillLintKind | null {
  if (
    explicit === 'buyer-goal' ||
    explicit === 'platform-wrapper' ||
    explicit === 'agent-skills-global'
  ) {
    return explicit;
  }
  const normalized = path.replace(/\\/g, '/');
  if (normalized.includes('/extensions/skills/')) return 'buyer-goal';
  if (normalized.includes('/extensions/platform-skills/')) return 'platform-wrapper';
  if (normalized.endsWith('SKILL.md')) return 'agent-skills-global';
  if (normalized.includes('-vybekiit.md')) return 'platform-wrapper';
  return null;
}

/**
 * Lint an extension skill file before persisting.
 * Usage: vybekiit lint-extension-skill <path> [--kind buyer-goal|platform-wrapper|agent-skills-global]
 */
export async function runLintExtensionSkill(args: string[]): Promise<LintExtensionSkillResult> {
  const path = args.find((a) => !a.startsWith('--'));
  const kindFlag = args.find((a) => a.startsWith('--kind='))?.slice('--kind='.length);

  if (!path) {
    return {
      json: JSON.stringify({
        ok: false,
        error: 'Usage: vybekiit lint-extension-skill <path> [--kind=...]',
      }),
      exitCode: 1,
    };
  }

  const kind = inferKind(path, kindFlag);
  if (!kind) {
    return {
      json: JSON.stringify({
        ok: false,
        error:
          'Could not infer skill kind — pass --kind=buyer-goal|platform-wrapper|agent-skills-global',
      }),
      exitCode: 1,
    };
  }

  let content: string;
  try {
    content = await readFile(path, 'utf8');
  } catch {
    return {
      json: JSON.stringify({ ok: false, error: `Cannot read file: ${path}` }),
      exitCode: 1,
    };
  }

  const report = lintExtensionSkill({ kind, content, path });
  return {
    json: JSON.stringify({ ok: report.ok, kind, path, issues: report.issues }, null, 2),
    exitCode: report.ok ? 0 : 1,
  };
}
