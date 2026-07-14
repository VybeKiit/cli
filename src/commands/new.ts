import process from 'node:process';
import { runCreateApp } from './createApp';
import {
  CREATE_SURFACE_LIST_FLAGS,
  CREATE_SURFACE_PIPE_FLAGS,
  isCreateSurface,
} from './createSurfaceRegistry';

/**
 * Deprecated scaffold entry — maps to `create app` when possible (ADR-0038).
 *
 * @param args - CLI arguments after `new`; optional template then directory.
 * @returns Process exit code for the command.
 * @example
 * const exitCode = await runNew(['web', 'my-app']);
 */
export const runNew = async (args: string[]): Promise<number> => {
  const [template, dir] = args;

  process.stderr.write(
    `Note: \`vybekiit new\` is deprecated. Use \`vybekiit create app ${CREATE_SURFACE_PIPE_FLAGS}\`.\n`,
  );

  if (template !== undefined && template !== '' && isCreateSurface(template)) {
    const forwarded = dir === undefined || dir === '' ? [`--${template}`] : [`--${template}`, dir];
    return await runCreateApp(forwarded);
  }

  if (template === undefined || template === '') {
    return await runCreateApp([]);
  }

  process.stderr.write(
    `Unknown surface "${template}". Use ${CREATE_SURFACE_LIST_FLAGS} (spa is not a create-app surface).\n`,
  );
  process.stderr.write(
    'Examples:\n  vybekiit create app --web my-app\n  vybekiit create app --mobile\n',
  );
  return 1;
};
