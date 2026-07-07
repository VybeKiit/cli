import { resolve } from 'node:path';
import { resolveTemplatesSource } from '../lib/resolveTemplates';
import { isTemplateName, ScaffoldError, scaffold } from '../lib/scaffold';
import { promptTemplateSelect } from '../prompts/templateSelect';
import { isInteractive } from '../prompts/tty';

/**
 * Scaffold a new project from one VybeKiit template.
 *
 * @param args - CLI arguments after `new`; template then optional destination directory.
 * @returns Process exit code for the command.
 * @example
 * const exitCode = await runNew(['web', 'my-app']);
 */
export const runNew = async (args: string[]): Promise<number> => {
  let [template, dir] = args;

  if ((template === undefined || template === '') && isInteractive()) {
    const picked = await promptTemplateSelect();
    if (picked === null) {
      return 1;
    }
    template = picked;
  }

  if (template === undefined || template === '' || !isTemplateName(template)) {
    return 1;
  }

  const destName = dir === undefined || dir === '' ? template : dir;
  const dest = resolve(process.cwd(), destName);
  let cleanup: (() => Promise<void>) | undefined;
  try {
    const { cleanup: resolvedCleanup, source } = await resolveTemplatesSource(template);
    cleanup = resolvedCleanup;
    await scaffold({
      template,
      source,
      dest,
    });
  } catch (error) {
    if (error instanceof ScaffoldError) {
      return 1;
    }
    throw error;
  } finally {
    if (cleanup !== undefined) {
      await cleanup();
    }
  }
  return 0;
};
