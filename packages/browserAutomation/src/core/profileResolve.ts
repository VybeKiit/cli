import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { PROFILE_PATHS } from './types';

export type AutomateProfileKey = keyof typeof PROFILE_PATHS;

const MANIFEST_DIR = join(homedir(), '.vybekiit');
const MANIFEST_PATH = join(MANIFEST_DIR, 'automate-profiles.json');

type ProfileManifest = Partial<Record<AutomateProfileKey, { lastUsedAt: string; path: string }>>;

const ENV_KEYS: Record<AutomateProfileKey, string> = {
  cloudflare: 'AUTOMATE_PROFILE_CF',
  extension: 'AUTOMATE_PROFILE_CWS',
  godaddy: 'AUTOMATE_PROFILE_GD',
  google: 'AUTOMATE_PROFILE_GOOGLE',
  ls: 'AUTOMATE_PROFILE_LS',
  namecheap: 'AUTOMATE_PROFILE_NC',
  supabase: 'AUTOMATE_PROFILE_SUPABASE',
};

const readManifest = async (): Promise<ProfileManifest> => {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' ? (parsed as ProfileManifest) : {};
  } catch {
    return {};
  }
};

/**
 * Persist the last-used Chrome profile path for a domain.
 *
 * @param key - Automation profile key.
 * @param profilePath - Chrome user-data-dir path to remember.
 * @returns A promise that resolves after the manifest is written.
 * @example
 * await rememberProfilePath('extension', '/tmp/cws-profile');
 */
export const rememberProfilePath = async (
  key: AutomateProfileKey,
  profilePath: string,
): Promise<void> => {
  const manifest = await readManifest();
  manifest[key] = { path: profilePath, lastUsedAt: new Date().toISOString() };
  await mkdir(MANIFEST_DIR, { recursive: true });
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
};

/**
 * Resolve Chrome user-data-dir for a domain.
 *
 * @param key - Automation profile key.
 * @param override - Optional CLI profile override or `last`.
 * @returns The resolved Chrome user-data-dir path.
 * @example
 * const profilePath = await resolveProfilePath('extension', 'last');
 */
export const resolveProfilePath = async (
  key: AutomateProfileKey,
  override?: string,
): Promise<string> => {
  if (override && override !== 'last') {
    return override;
  }

  const envPath = process.env[ENV_KEYS[key]]?.trim();
  if (envPath !== undefined && envPath.length > 0) {
    return envPath;
  }

  if (override === 'last') {
    const manifest = await readManifest();
    const entry = manifest[key];
    if (entry !== undefined && entry.path.length > 0) {
      return entry.path;
    }
  }

  return PROFILE_PATHS[key];
};

/**
 * Resolve the environment variable name for a profile key.
 *
 * @param key - Automation profile key.
 * @returns Environment variable name used for that profile.
 * @example
 * const envVar = profileEnvVar('extension');
 */
export const profileEnvVar = (key: AutomateProfileKey): string => ENV_KEYS[key];
