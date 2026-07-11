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
 *
 * @param encoded - Encoded project dir segment.
 * @returns Best-effort filesystem path.
 * @example
 * decodeClaudeProjectPath('-Users-me-Code'); // '/Users/me/Code'
 */
export const decodeClaudeProjectPath = (encoded: string): string => {
  if (encoded.startsWith('-')) {
    return `/${encoded.slice(1).replaceAll('-', '/')}`;
  }
  return encoded.replaceAll('-', '/');
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
