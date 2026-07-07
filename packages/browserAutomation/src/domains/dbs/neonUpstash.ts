import { printError, printJson, printLine } from '@vybekiit/browser-automation/cli/output';
import type { CommandRegistry } from '@vybekiit/browser-automation/cli/registry';
import { ensureCli } from '@vybekiit/browser-automation/core/ensureCli';
import { writeEnvBlock } from '@vybekiit/browser-automation/core/writeEnvBlock';
import { listNeonProjects, readNeonConnectionString } from './neon';

/**
 * Neon — CLI-first `DATABASE_URL`.
 *
 * @param registry - Command registry receiving domain commands.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerNeonDomain(registry);
 */
export const registerNeonDomain = (registry: CommandRegistry): void => {
  registry.register({
    name: 'dbs/neon',
    aliases: ['neon'],
    commands: {
      setup: {
        description: 'Read Neon DATABASE_URL into .env via neonctl (--project-id)',
        run: async ({ args, flags }) => {
          const cli = ensureCli('neonctl', {});
          if (!cli.installed) {
            const message = 'neonctl could not be installed.';
            if (flags.json) printJson({ ok: false, tool: 'neonctl', error: message });
            else printError(message, false);
            return 1;
          }

          let projectId: string | undefined;
          for (const arg of args) {
            if (arg.startsWith('--project-id=')) projectId = arg.slice('--project-id='.length);
          }
          if (!projectId) {
            const projects = listNeonProjects();
            if (projects.length === 1) projectId = projects[0]?.id;
          }
          if (!projectId) {
            const message =
              'Could not resolve a Neon project. Run `neonctl auth`, then pass --project-id=<id>.';
            if (flags.json) printJson({ ok: false, error: message });
            else printError(message, false);
            return 1;
          }

          const connectionString = readNeonConnectionString(projectId);
          if (!connectionString) {
            const message = `neonctl could not return a connection string for project ${projectId}.`;
            if (flags.json) printJson({ ok: false, error: message });
            else printError(message, false);
            return 1;
          }

          const written = await writeEnvBlock({ DATABASE_URL: connectionString });
          if (flags.json) {
            printJson({ ok: true, projectId, keysWritten: written.keysWritten });
          } else {
            printLine('OK: Neon setup complete.');
            printLine(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
          }
          return 0;
        },
      },
    },
  });
};

/**
 * Upstash — REST-first (no first-party CLI to mint a token).
 *
 * @param registry - Command registry receiving domain commands.
 * @returns Nothing; registers commands on the provided registry.
 * @example
 * registerUpstashDomain(registry);
 */
export const registerUpstashDomain = (registry: CommandRegistry): void => {
  registry.register({
    name: 'dbs/upstash',
    aliases: ['upstash'],
    commands: {
      setup: {
        description: 'Persist + verify Upstash Redis REST creds (--rest-url --rest-token)',
        run: async ({ args, flags }) => {
          let restUrl: string | undefined;
          let restToken: string | undefined;
          for (const arg of args) {
            if (arg.startsWith('--rest-url=')) restUrl = arg.slice('--rest-url='.length);
            if (arg.startsWith('--rest-token=')) restToken = arg.slice('--rest-token='.length);
          }
          if (!(restUrl && restToken)) {
            const message =
              'Upstash has no CLI to mint a token. Copy the REST URL + token from the console and pass --rest-url= --rest-token=.';
            if (flags.json) printJson({ ok: false, error: message });
            else printError(message, false);
            return 1;
          }

          const verified = await verifyUpstash(restUrl, restToken);

          const written = await writeEnvBlock({
            UPSTASH_REDIS_REST_URL: restUrl,
            UPSTASH_REDIS_REST_TOKEN: restToken,
          });
          if (flags.json) {
            printJson({ ok: verified, keysWritten: written.keysWritten, verified });
          } else {
            printLine('OK: Upstash setup complete.');
            printLine(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
            printLine(verified ? '✓ Verified via Upstash REST ping.' : '⚠ Verification failed.');
          }
          return verified ? 0 : 1;
        },
      },
    },
  });
};

const verifyUpstash = async (restUrl: string, restToken: string): Promise<boolean> => {
  try {
    const res = await fetch(`${restUrl.replace(/\/$/, '')}/ping`, {
      headers: { Authorization: `Bearer ${restToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
};
