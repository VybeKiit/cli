import { join } from 'node:path';
import { caughtMessage } from '@vybekiit/core';
import { locateTemplateSource } from '../lib/templateSource';
import {
  copyClaudeHooks,
  copyPrePushHook,
  copySecurityFile,
  copyWorkflows,
  createDevScriptsDir,
  generatePlatformConfigs,
} from './initAssets';
import { detectPackageManager, detectProjectType } from './initDetect';
import { writeInitFailure, writeInitSuccess } from './initOutput';
import { patchGitignore, patchPackageScripts } from './initPatches';

/**
 * Bootstrap VybeKiit guardrails on an existing project.
 *
 * @param args - CLI arguments after the `init` command name.
 * @returns Exit code for the command process.
 * @example
 * const code = await runInit(['./my-app']);
 */
export const runInit = async (args: string[]): Promise<number> => {
  const [targetPath] = args;
  const cwd =
    targetPath !== undefined && targetPath !== '' ? join(process.cwd(), targetPath) : process.cwd();

  process.stdout.write('🔒 VybeKiit init: bootstrapping security guardrails...\n');
  process.stdout.write('\n');

  const pm = await detectPackageManager(cwd);
  if (pm === null) {
    return writeInitFailure(
      'Could not detect a package manager. Add a lockfile or packageManager field.',
    );
  }

  const projectType = await detectProjectType(cwd);
  if (projectType === null) {
    return writeInitFailure('Could not detect project type from package dependencies.');
  }

  process.stdout.write(`  Detected: ${projectType} project using ${pm}\n`);

  let cleanup: (() => Promise<void>) | undefined;
  try {
    const { cleanup: resolvedCleanup, source } = await locateTemplateSource(projectType);
    cleanup = resolvedCleanup;
    const templateDir = join(source, projectType);

    await copyClaudeHooks(cwd, templateDir);
    await copyWorkflows(cwd, templateDir, pm);
    await copyPrePushHook(cwd, templateDir);
    await copySecurityFile(cwd, templateDir);
    await createDevScriptsDir(cwd);
    await generatePlatformConfigs(cwd);
    await patchGitignore(cwd);
    await patchPackageScripts(cwd, pm);
    writeInitSuccess(pm);
    return 0;
  } catch (error) {
    const message = caughtMessage(error, 'Could not initialize VybeKiit guardrails.');
    return writeInitFailure(message);
  } finally {
    if (cleanup !== undefined) {
      await cleanup();
    }
  }
};
