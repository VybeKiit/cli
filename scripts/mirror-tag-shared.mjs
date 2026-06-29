/** Shared constants for mirror tagging scripts. */
export const MIRROR_ORG = 'VybeKiit';

const REPO_ROOT = new URL('..', import.meta.url).pathname;

/** @param {string} text */
export function redact(text) {
  const token = process.env.GH_MIRROR_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) {
    return text;
  }
  return text.split(token).join('***');
}

/** @param {string} path */
export async function prefixExists(path) {
  const { access } = await import('node:fs/promises');
  const { join } = await import('node:path');
  try {
    await access(join(REPO_ROOT, path));
    return true;
  } catch {
    return false;
  }
}
