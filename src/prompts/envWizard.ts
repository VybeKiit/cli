import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cancel, isCancel, text } from '@clack/prompts';
import { TECH_REFERENCE_MAP } from '@vybekiit/agent-kit';

// Match / no-match: "NEXT_PUBLIC_SITE_URL" matches, "nextPublicSiteUrl" does not.
const ENV_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/**
 * Read uppercase environment keys from an example env file.
 *
 * @param raw - Raw `.env.example` file contents.
 * @returns Ordered env keys that look like maintained config keys.
 */
const parseExampleEnvKeys = (raw: string): string[] =>
  raw.split('\n').reduce<string[]>((keys, line) => {
    const separatorIndex = line.indexOf('=');

    if (separatorIndex < 1) {
      return keys;
    }

    const key = line.slice(0, separatorIndex);
    if (ENV_KEY_PATTERN.test(key)) {
      keys.push(key);
    }

    return keys;
  }, []);

/**
 * Remove one pair of wrapping double quotes from an env value.
 *
 * @param value - Raw value text from a `KEY=value` line.
 * @returns The value without wrapping quotes when both quote marks are present.
 */
const stripEnvValueQuotes = (value: string): string => {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }

  return value;
};

/**
 * Read the current value for one env key from an env file body.
 *
 * @param envContent - Existing `.env` file contents.
 * @param key - Environment key to read.
 * @returns The current value, or an empty string when the key is missing.
 */
const readCurrentEnvValue = (envContent: string, key: string): string => {
  const prefix = `${key}=`;
  const line = envContent.split('\n').find((candidate) => candidate.startsWith(prefix));

  if (line === undefined) {
    return '';
  }

  return stripEnvValueQuotes(line.slice(prefix.length));
};

/**
 * Write one env key/value pair into an env file body.
 *
 * @param envContent - Existing `.env` file contents.
 * @param key - Environment key to write.
 * @param value - Value returned from the interactive prompt.
 * @returns Updated `.env` file contents with the key set exactly once.
 */
const upsertEnvLine = (envContent: string, key: string, value: string): string => {
  const nextLine = `${key}="${value}"`;
  const prefix = `${key}=`;
  const lines = envContent.split('\n');
  let updated = false;

  const nextLines = lines.map((line) => {
    if (!line.startsWith(prefix)) {
      return line;
    }

    updated = true;
    return nextLine;
  });

  if (updated) {
    return nextLines.join('\n');
  }

  if (envContent === '' || envContent.endsWith('\n')) {
    return `${envContent}${nextLine}\n`;
  }

  return `${envContent}\n${nextLine}\n`;
};

/**
 * Walk `.env.example` keys interactively (TTY only). Descriptions include doc links when known.
 *
 * @param cwd - Project directory that contains `.env.example` and `.env`.
 * @returns Exit code `0` after writing `.env`, or `1` when setup is cancelled or unavailable.
 * @example
 * const exitCode = await runEnvWizard(process.cwd());
 */
export const runEnvWizard = async (cwd: string = process.cwd()): Promise<number> => {
  const examplePath = join(cwd, '.env.example');
  let raw: string;
  try {
    raw = await readFile(examplePath, 'utf8');
  } catch {
    process.stderr.write('No .env.example in this folder.\n');
    return 1;
  }

  const keys = parseExampleEnvKeys(raw);
  const envPath = join(cwd, '.env');
  let envContent = '';
  try {
    envContent = await readFile(envPath, 'utf8');
  } catch {
    // new .env
  }

  for (const key of keys) {
    const ref = Object.values(TECH_REFERENCE_MAP).find((r) => r.envKeys?.includes(key));
    const docsHint = ref ? ` (Docs: ${ref.docsUrl})` : '';
    const current = readCurrentEnvValue(envContent, key);
    // biome-ignore lint/performance/noAwaitInLoops: The env wizard must ask one key at a time.
    const value = await text({
      message: `${key}${docsHint}`,
      defaultValue: current,
      placeholder: current,
    });
    if (isCancel(value)) {
      cancel('Cancelled.');
      return 1;
    }

    envContent = upsertEnvLine(envContent, key, value);
  }

  const { writeFile } = await import('node:fs/promises');
  await writeFile(envPath, envContent, 'utf8');
  return 0;
};
