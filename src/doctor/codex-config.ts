import { homedir } from 'node:os';
import { join } from 'node:path';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';

const FEATURES_BLOCK = '[features]\nskills = true';

function codexConfigPath(): string {
  const home = process.env.CODEX_HOME?.trim() || join(homedir(), '.codex');
  return join(home, 'config.toml');
}

function upsertFeaturesSkills(content: string): string {
  if (/\[features\][\s\S]*?\bskills\s*=\s*true\b/m.test(content)) {
    return content;
  }

  if (/\[features\]/m.test(content)) {
    return content.replace(/(\[features\][^[]*)/m, (block) =>
      /\bskills\s*=/m.test(block)
        ? block.replace(/\bskills\s*=\s*.*/m, 'skills = true')
        : `${block.trimEnd()}\nskills = true\n`,
    );
  }

  const trimmed = content.trimEnd();
  if (!trimmed) {
    return `${FEATURES_BLOCK}\n`;
  }
  return `${trimmed}\n\n${FEATURES_BLOCK}\n`;
}

/** Enable Codex Agent Skills discovery in ~/.codex/config.toml (idempotent). */
export async function ensureCodexSkillsEnabled(): Promise<{
  readonly updated: boolean;
  readonly path: string;
}> {
  const path = codexConfigPath();
  await mkdir(join(path, '..'), { recursive: true });

  let previous = '';
  try {
    previous = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  const next = upsertFeaturesSkills(previous);
  if (next === previous) {
    return { updated: false, path };
  }

  await writeFile(path, next, 'utf8');
  return { updated: true, path };
}

/** True when Codex skills feature is enabled in config (best-effort read). */
export async function isCodexSkillsEnabled(): Promise<boolean> {
  const path = codexConfigPath();
  try {
    await access(path);
    const content = await readFile(path, 'utf8');
    return /\bskills\s*=\s*true\b/m.test(content);
  } catch {
    return false;
  }
}
