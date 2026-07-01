import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { input } from '@inquirer/prompts';
import { TECH_REFERENCE_MAP } from '@vybekiit/agent-kit';

/**
 * Walk `.env.example` keys interactively (TTY only). Descriptions include doc links when known.
 */
export async function runEnvWizard(cwd: string = process.cwd()): Promise<number> {
  const examplePath = join(cwd, '.env.example');
  let raw: string;
  try {
    raw = await readFile(examplePath, 'utf8');
  } catch {
    console.error('No .env.example in this folder.');
    return 1;
  }

  const keys = [...raw.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]!);
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
    // read this key's current line and unquote it: 'PORT="3000"' → '3000'
    const current = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.replace(/^"|"$/g, '');
    const value = await input({
      message: `${key}${docsHint}`,
      default: current ?? '',
    });
    if (envContent.includes(`${key}=`)) {
      // replace the whole KEY=... line: 'PORT=old' → 'PORT="new"'
      envContent = envContent.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}="${value}"`);
    } else {
      envContent += `${envContent.endsWith('\n') || envContent === '' ? '' : '\n'}${key}="${value}"\n`;
    }
  }

  const { writeFile } = await import('node:fs/promises');
  await writeFile(envPath, envContent, 'utf8');
  return 0;
}
