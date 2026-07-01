import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTemplatesSource } from '../lib/resolveTemplates';
import { isTemplateName, ScaffoldError, scaffold, type TemplateName } from '../lib/scaffold';
import { promptTemplateSelect } from '../prompts/templateSelect';
import { isInteractive } from '../prompts/tty';

const HERE = dirname(fileURLToPath(import.meta.url));

async function readVersion(): Promise<string> {
  try {
    const raw = await readFile(join(HERE, '..', '..', 'package.json'), 'utf8');
    return (JSON.parse(raw) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export async function runNew(args: string[]): Promise<number> {
  let [template, dir] = args;

  if (!template && isInteractive()) {
    const picked = await promptTemplateSelect();
    if (!picked) return 1;
    template = picked;
  }

  if (!(template && isTemplateName(template))) {
    return 1;
  }

  const dest = resolve(process.cwd(), dir ?? template);
  let cleanup: (() => Promise<void>) | undefined;
  try {
    const resolved = await resolveTemplatesSource(template as TemplateName);
    cleanup = resolved.cleanup;
    await scaffold({
      template: template as TemplateName,
      source: resolved.source,
      dest,
      packagesVersion: await readVersion(),
    });
  } catch (error) {
    if (error instanceof ScaffoldError) {
      return 1;
    }
    throw error;
  } finally {
    await cleanup?.();
  }
  return 0;
}
