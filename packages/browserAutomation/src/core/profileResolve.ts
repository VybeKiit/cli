import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { PROFILE_PATHS } from './types';

export type AutomateProfileKey = keyof typeof PROFILE_PATHS;

const MANIFEST_DIR = join(homedir(), '.vybekiit');
const MANIFEST_PATH = join(MANIFEST_DIR, 'automate-profiles.json');

type ProfileManifest = Partial<Record<AutomateProfileKey, { lastUsedAt: string; path: string }>>;

const ENV_KEYS: Record<AutomateProfileKey, string> = {
  extension: 'AUTOMATE_PROFILE_CWS',
  ls: 'AUTOMATE_PROFILE_LS',
  namecheap: 'AUTOMATE_PROFILE_NC',
  godaddy: 'AUTOMATE_PROFILE_GD',
  google: 'AUTOMATE_PROFILE_GOOGLE',
};

async function readManifest(): Promise<ProfileManifest> {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf8');
    const parsed = JSON.parse(raw) as ProfileManifest;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Persist last-used profile path — merges only; never deletes profile directories. */
export async function rememberProfilePath(
  key: AutomateProfileKey,
  profilePath: string,
): Promise<void> {
  const manifest = await readManifest();
  manifest[key] = { path: profilePath, lastUsedAt: new Date().toISOString() };
  await mkdir(MANIFEST_DIR, { recursive: true });
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

/**
 * Resolve Chrome user-data-dir for a domain.
 * Priority: CLI `--profile=` > env > `--profile=last` > package default.
 * Existing profile data is always preserved (paths are never deleted here).
 */
export async function resolveProfilePath(
  key: AutomateProfileKey,
  override?: string,
): Promise<string> {
  if (override && override !== 'last') {
    return override;
  }

  const envPath = process.env[ENV_KEYS[key]]?.trim();
  if (envPath) return envPath;

  if (override === 'last') {
    const manifest = await readManifest();
    const entry = manifest[key];
    if (entry?.path) return entry.path;
  }

  return PROFILE_PATHS[key];
}

export function profileEnvVar(key: AutomateProfileKey): string {
  return ENV_KEYS[key];
}
