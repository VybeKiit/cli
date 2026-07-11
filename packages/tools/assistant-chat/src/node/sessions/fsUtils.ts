import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Read a directory listing, returning [] when the path does not exist.
 *
 * @param directory - Absolute directory path.
 * @returns Entry names, or empty array on ENOENT.
 * @example
 * const files = await readDirSafe(homedir());
 */
export const readDirSafe = async (directory: string): Promise<string[]> => {
  try {
    return await readdir(directory);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

/**
 * Read a UTF-8 file, returning null when missing.
 *
 * @param path - Absolute file path.
 * @returns File contents or null.
 * @example
 * const raw = await readFileSafe('/tmp/x');
 */
export const readFileSafe = async (path: string): Promise<string | null> => {
  try {
    return await readFile(path, 'utf-8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
};

/**
 * File mtime as ISO string, or empty string when missing.
 *
 * @param path - Absolute file path.
 * @returns ISO timestamp.
 * @example
 * const iso = await mtimeIso('/tmp/x');
 */
export const mtimeIso = async (path: string): Promise<string> => {
  try {
    const info = await stat(path);
    return info.mtime.toISOString();
  } catch {
    return '';
  }
};

/**
 * Walk one level of subdirectories (not recursive) and return absolute paths.
 *
 * @param directory - Parent directory.
 * @returns Absolute child directory paths.
 * @example
 * const children = await listSubdirs(home);
 */
export const listSubdirs = async (directory: string): Promise<string[]> => {
  const names = await readDirSafe(directory);
  const results: string[] = [];
  for (const name of names) {
    const full = join(directory, name);
    try {
      const info = await stat(full);
      if (info.isDirectory()) {
        results.push(full);
      }
    } catch {
      // skip unreadable entries
    }
  }
  return results;
};

/**
 * Extract a string field from unknown JSON data.
 *
 * @param data - Parsed object.
 * @param key - Field name.
 * @param defaultValue - Fallback.
 * @returns String value.
 * @example
 * valueText({ a: 1 }, 'a', ''); // '1'
 */
export const valueText = (
  data: Record<string, unknown>,
  key: string,
  defaultValue: string,
): string => {
  const value = data[key];
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return String(value);
};

/**
 * Strip a known extension from a filename.
 *
 * @param file - File name.
 * @returns Base name without .json / .jsonl.
 * @example
 * sessionIdFromFile('abc.jsonl'); // 'abc'
 */
export const sessionIdFromFile = (file: string): string => {
  if (file.endsWith('.jsonl')) {
    return file.slice(0, -'.jsonl'.length);
  }
  if (file.endsWith('.json')) {
    return file.slice(0, -'.json'.length);
  }
  return file;
};

/**
 * Decode Claude project folder names (`-Users-foo-bar` → `/Users/foo/bar`).
 * Prefer a real `cwd` from the transcript when available — hyphens in folder
 * names are ambiguous in this encoding (`email-sender` → `email/sender`).
 *
 * @param encoded - Encoded project dir segment.
 * @returns Best-effort filesystem path.
 * @example
 * decodeClaudeProjectPath('-Users-me-Code'); // '/Users/me/Code'
 */
export const decodeClaudeProjectPath = (encoded: string): string =>
  decodeEncodedProjectPath(encoded);

/**
 * Restore path separators after Claude/Cursor replace non-alphanumerics with `-`.
 * Hyphens inside path segments are irreversible (prefer transcript `cwd`).
 *
 * @param segments - Encoded path without a leading drive/root marker.
 * @returns Slash-joined path segments.
 */
const dashesToSlashes = (segments: string): string => segments.replaceAll('-', '/');

/**
 * Decode agent project folder names used by Claude and Cursor across OSes.
 *
 * Encoding (Claude docs): working-directory path with non-alphanumeric chars
 * replaced by `-`. Observed shapes:
 * - macOS: `-Users-me-Code` or Cursor `Users-me-Code`
 * - Linux/Ubuntu: `-home-ubuntu-proj` or Cursor `home-ubuntu-proj`
 * - Windows: `C--Users-me-Code` (`C:\…` → drive + `--` for `:\`) or
 *   `-C-Users-me-Code` (leading-dash style)
 * - WSL mounts: `-mnt-c-Users-me-Code`
 *
 * Pure numeric / temp hash folders return empty (not a real path). Prefer a
 * real `cwd` from the transcript when available — hyphens in folder names are
 * ambiguous (`email-sender` → `email/sender`).
 *
 * @param encoded - Project directory basename under the agent store.
 * @returns Best-effort absolute path, or empty when not decodable.
 * @example
 * decodeEncodedProjectPath('Users-me-Desktop-Code'); // '/Users/me/Desktop/Code'
 * decodeEncodedProjectPath('C--Users-me-Code'); // 'C:/Users/me/Code'
 * decodeEncodedProjectPath('-home-ubuntu-app'); // '/home/ubuntu/app'
 */
export const decodeEncodedProjectPath = (encoded: string): string => {
  if (encoded.length === 0) {
    return '';
  }
  // Cursor sometimes stores hash ids or temp paths — not user project folders.
  if (/^\d+$/.test(encoded) || encoded === 'empty-window' || encoded.startsWith('var-folders-')) {
    return '';
  }

  // Windows: C--Users-foo-bar (colon + backslash became `--`). Highest confidence.
  // Must run before Unix rules — do not treat `-Users-…` as a Windows drive.
  const winDriveDouble = /^([A-Za-z])--(.+)$/.exec(encoded);
  if (winDriveDouble !== null) {
    const drive = winDriveDouble[1] ?? '';
    const rest = winDriveDouble[2] ?? '';
    if (drive.length > 0 && rest.length > 0) {
      return `${drive.toUpperCase()}:/${dashesToSlashes(rest)}`;
    }
  }

  // Windows: C-Users-foo (single dash after drive letter, common root names only).
  const winDriveSingle =
    /^([A-Za-z])-(Users|users|home|Documents|Desktop|Projects|dev|src)-(.+)$/.exec(encoded);
  if (winDriveSingle !== null) {
    const drive = winDriveSingle[1] ?? '';
    const head = winDriveSingle[2] ?? '';
    const rest = winDriveSingle[3] ?? '';
    if (drive.length > 0 && head.length > 0) {
      return `${drive.toUpperCase()}:/${dashesToSlashes(`${head}-${rest}`)}`;
    }
  }

  // Windows leading-dash: -C-Users-foo (require known Windows root after drive).
  const winDriveLeading =
    /^-([A-Za-z])-(Users|users|home|Documents|Desktop|Projects|dev|src)-(.+)$/.exec(encoded);
  if (winDriveLeading !== null) {
    const drive = winDriveLeading[1] ?? '';
    const head = winDriveLeading[2] ?? '';
    const rest = winDriveLeading[3] ?? '';
    if (drive.length > 0 && head.length > 0) {
      return `${drive.toUpperCase()}:/${dashesToSlashes(`${head}-${rest}`)}`;
    }
  }

  const stripped = encoded.startsWith('-') ? encoded.slice(1) : encoded;

  // Unix absolute-ish prefixes (macOS Users, Linux home, WSL /mnt/…).
  if (
    stripped.startsWith('Users-') ||
    stripped.startsWith('home-') ||
    stripped.startsWith('mnt-') ||
    stripped.startsWith('private-') ||
    stripped.startsWith('var-') ||
    stripped.startsWith('opt-') ||
    stripped.startsWith('root-') ||
    stripped.startsWith('workspace-') ||
    stripped.startsWith('app-')
  ) {
    return `/${dashesToSlashes(stripped)}`;
  }

  // Claude-style: any folder that started with `-` was an absolute path.
  if (encoded.startsWith('-') && stripped.length > 0) {
    return `/${dashesToSlashes(stripped)}`;
  }

  return '';
};

/**
 * Pull plain text from Claude/Cursor-style message content.
 *
 * @param content - String or content-part array.
 * @returns Flattened text.
 * @example
 * extractTextContent('hi'); // 'hi'
 */
export const extractTextContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return '';
  }

  const parts: string[] = [];
  for (const part of content) {
    if (typeof part === 'string') {
      parts.push(part);
      continue;
    }
    if (part && typeof part === 'object' && 'text' in part) {
      const text = (part as { text?: unknown }).text;
      if (typeof text === 'string') {
        parts.push(text);
      }
    }
  }
  return parts.join('\n').trim();
};

/**
 * Collapse whitespace and truncate for session titles.
 *
 * @param text - Raw text.
 * @param max - Max length.
 * @returns Clean title.
 * @example
 * cleanTitle('  hello  world  ', 20);
 */
export const cleanTitle = (text: string, max = 120): string => {
  const cleaned = text.replaceAll(/\s+/g, ' ').trim();
  if (cleaned.length === 0) {
    return '(untitled)';
  }
  if (cleaned.length <= max) {
    return cleaned;
  }
  return `${cleaned.slice(0, max - 1)}…`;
};

/**
 * Whether a Claude/Cursor line looks like noise (local commands, caveats).
 *
 * @param text - Message text.
 * @returns True when it should not become a title.
 * @example
 * isNoiseMessage('<local-command-caveat>…');
 */
export const isNoiseMessage = (text: string): boolean => {
  const lower = text.toLowerCase();
  return (
    lower.includes('<local-command') ||
    lower.includes('<command-name>') ||
    lower.includes('caveat:') ||
    lower.startsWith('/model') ||
    lower.startsWith('/clear')
  );
};
