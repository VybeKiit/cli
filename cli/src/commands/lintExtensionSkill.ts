import { readFile } from 'node:fs/promises';
import { type ExtensionSkillLintKind, lintExtensionSkill } from '@vybekiit/agent-kit';

/** JSON result returned by the extension skill linter command. */
export type LintExtensionSkillResult = {
  readonly json: string;
  readonly exitCode: number;
};

/**
 * Resolve the extension skill kind from an explicit flag or path convention.
 *
 * @param path - Skill file path passed to the command.
 * @param explicit - Optional `--kind` flag value.
 * @returns Lint kind, or null when the kind cannot be inferred.
 * @example
 * const kind = resolveExtensionSkillKind('extensions/skills/payments.md');
 */
const resolveExtensionSkillKind = (
  path: string,
  explicit?: string,
): ExtensionSkillLintKind | null => {
  if (
    explicit === 'buyer-goal' ||
    explicit === 'platform-wrapper' ||
    explicit === 'agent-skills-global'
  ) {
    return explicit;
  }
  const normalized = path.split('\\').join('/');
  if (normalized.includes('/extensions/skills/')) {
    return 'buyer-goal';
  }
  if (normalized.includes('/extensions/platform-skills/')) {
    return 'platform-wrapper';
  }
  if (normalized.endsWith('SKILL.md')) {
    return 'agent-skills-global';
  }
  if (normalized.includes('-vybekiit.md')) {
    return 'platform-wrapper';
  }
  return null;
};

/**
 * Lint an extension skill file before persisting.
 *
 * @param args - CLI arguments after `lint-extension-skill`.
 * @returns JSON lint report plus the process exit code.
 * @example
 * const result = await runLintExtensionSkill(['skill.md', '--kind=buyer-goal']);
 */
export const runLintExtensionSkill = async (args: string[]): Promise<LintExtensionSkillResult> => {
  const path = args.find((a) => !a.startsWith('--'));
  const kindArg = args.find((a) => a.startsWith('--kind='));
  const kindFlag = kindArg === undefined ? undefined : kindArg.slice('--kind='.length);

  if (path === undefined || path === '') {
    return {
      json: JSON.stringify({
        ok: false,
        error: 'Usage: vybekiit lint-extension-skill <path> [--kind=...]',
      }),
      exitCode: 1,
    };
  }

  const kind = resolveExtensionSkillKind(path, kindFlag);
  if (kind === null) {
    return {
      json: JSON.stringify({
        ok: false,
        error:
          'Could not infer skill kind. Pass --kind=buyer-goal|platform-wrapper|agent-skills-global',
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
};
