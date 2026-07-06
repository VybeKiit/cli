import { resolve } from 'node:path';
import { resolveTemplatesSource } from '../lib/resolveTemplates';
import { isTemplateName, ScaffoldError, scaffold, type TemplateName } from '../lib/scaffold';
import { promptTemplateSelect } from '../prompts/templateSelect';
import { isInteractive } from '../prompts/tty';

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
