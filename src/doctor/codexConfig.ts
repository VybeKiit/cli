import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const FEATURES_BLOCK = ['[features]', 'skills = true'].join('\n');
// "[features]\nskills = true" -> already enabled.
const FEATURES_SKILLS_ENABLED_PATTERN = /\[features\][\s\S]*?\bskills\s*=\s*true\b/m;
// "[features]\nskills = false\n[other]" -> captures the features block only.
const FEATURES_BLOCK_PATTERN = /(\[features\][^[]*)/m;
// "skills = false" -> feature key exists.
const SKILLS_KEY_PATTERN = /\bskills\s*=/m;
// "skills = false" -> "skills = true".
const SKILLS_LINE_PATTERN = /\bskills\s*=\s*.*/m;

/**
 * Resolve the Codex config path.
 *
 * @returns Absolute path to `config.toml`.
 * @example
 * const path = codexConfigPath();
 */
const codexConfigPath = (): string => {
  const configuredHome = process.env.CODEX_HOME;
  if (configuredHome !== undefined && configuredHome.trim() !== '') {
    return join(configuredHome.trim(), 'config.toml');
  }
  const home = join(homedir(), '.codex');
  return join(home, 'config.toml');
};

/**
 * Enable the Codex skills feature inside config content.
 *
 * @param content - Existing TOML content.
 * @returns Updated TOML content.
 * @example
 * const next = upsertFeaturesSkills('[features]\\nskills = false\\n');
 */
const upsertFeaturesSkills = (content: string): string => {
  if (FEATURES_SKILLS_ENABLED_PATTERN.test(content)) {
    return content;
  }

  if (content.includes('[features]')) {
    return content.replace(FEATURES_BLOCK_PATTERN, (block) =>
      SKILLS_KEY_PATTERN.test(block)
        ? block.replace(SKILLS_LINE_PATTERN, 'skills = true')
        : `${block.trimEnd()}\nskills = true\n`,
    );
  }

  const trimmed = content.trimEnd();
  if (!trimmed) {
    return `${FEATURES_BLOCK}\n`;
  }
  return `${trimmed}\n\n${FEATURES_BLOCK}\n`;
};

/**
 * Enable Codex Agent Skills discovery in ~/.codex/config.toml.
 *
 * @returns Update status and config path.
 * @example
 * const result = await ensureCodexSkillsEnabled();
 */
export const ensureCodexSkillsEnabled = async (): Promise<{
  readonly updated: boolean;
  readonly path: string;
}> => {
  const path = codexConfigPath();
  await mkdir(join(path, '..'), { recursive: true });

  let previous = '';
  try {
    previous = await readFile(path, 'utf8');
  } catch (error) {
    if (!(error instanceof Error && 'code' in error) || error.code !== 'ENOENT') {
      throw error;
    }
  }

  const next = upsertFeaturesSkills(previous);
  if (next === previous) {
    return { updated: false, path };
  }

  await writeFile(path, next, 'utf8');
  return { updated: true, path };
};

/**
 * Check whether Codex skills discovery is enabled.
 *
 * @returns True when config contains `skills = true`.
 * @example
 * const enabled = await isCodexSkillsEnabled();
 */
export const isCodexSkillsEnabled = async (): Promise<boolean> => {
  const path = codexConfigPath();
  try {
    await access(path);
    const content = await readFile(path, 'utf8');
    return FEATURES_SKILLS_ENABLED_PATTERN.test(content);
  } catch {
    return false;
  }
};
