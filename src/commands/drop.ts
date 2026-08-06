import { join, resolve } from 'node:path';
import {
  cleanupDropSource,
  copyDropTemplate,
  locateDropTemplateSource,
  pinDeps,
  readDropDestinationState,
  shouldBlockDestination,
} from './dropFiles';
import { completeDropInputs, parseDropArgs } from './dropInput';
import {
  dropNextSteps,
  runDropDryRun,
  writeDestinationNotEmpty,
  writeDropError,
  writeDropSuccess,
} from './dropOutput';
import type { DropContext } from './dropTypes';

/**
 * Drop or merge a VybeKiit template into any directory.
 *
 * @param args - CLI arguments after the `drop` command name.
 * @returns Exit code for the command process.
 * @example
 * const code = await runDrop(['web', './my-app', '--merge']);
 */
export const runDrop = async (args: string[]): Promise<number> => {
  const inputs = await completeDropInputs(parseDropArgs(args));
  if (inputs === null) {
    return 1;
  }

  const dest = resolve(process.cwd(), inputs.destPath);
  let cleanup: (() => Promise<void>) | undefined;

  try {
    const { cleanup: sourceCleanup, source } = await locateDropTemplateSource(inputs.template);
    cleanup = sourceCleanup;
    const context: DropContext = {
      ...inputs,
      dest,
      templateDir: join(source, inputs.template),
    };
    const destination = await readDropDestinationState(dest);

    if (shouldBlockDestination(inputs.flags, destination)) {
      return writeDestinationNotEmpty(inputs.flags, dest);
    }
    if (inputs.flags.dryRun) {
      return await runDropDryRun(context);
    }

    await copyDropTemplate(context);
    await pinDeps(dest);
    writeDropSuccess(context, dropNextSteps(inputs.template, inputs.destPath));
    return 0;
  } catch (error) {
    return writeDropError(inputs.flags, error);
  } finally {
    await cleanupDropSource(cleanup);
  }
};
