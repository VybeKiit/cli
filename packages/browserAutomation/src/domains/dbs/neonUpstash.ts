import { printJson } from '@vybekiit/browserAutomation/cli/output';
import type { CommandRegistry } from '@vybekiit/browserAutomation/cli/registry';
import { ensureCli } from '@vybekiit/browserAutomation/core/ensureCli';
import { writeEnvBlock } from '@vybekiit/browserAutomation/core/writeEnvBlock';
import { listNeonProjects, readNeonConnectionString } from './neon';

/**
 * Neon — CLI-first `DATABASE_URL`.
 *
 * `setup` ensures `neonctl`, resolves the project (explicit `--project-id`, else the sole
 * project), reads the pooled connection string headlessly, writes `DATABASE_URL` to `.env`,
 * and verifies the CLI can reach the project. No browser path — Neon's CLI owns this fully.
 */
export function registerNeonDomain(registry: CommandRegistry): void {
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
            else console.error(message);
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
            else console.error(message);
            return 1;
          }

          const connectionString = readNeonConnectionString(projectId);
          if (!connectionString) {
            const message = `neonctl could not return a connection string for project ${projectId}.`;
            if (flags.json) printJson({ ok: false, error: message });
            else console.error(message);
            return 1;
          }

          const written = await writeEnvBlock({ DATABASE_URL: connectionString });
          if (flags.json) {
            printJson({ ok: true, projectId, keysWritten: written.keysWritten });
          } else {
            console.log('OK: Neon setup complete.');
            console.log(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
          }
          return 0;
        },
      },
    },
  });
}

/**
 * Upstash — REST-first (no first-party CLI to mint a token).
 *
 * Upstash surfaces the REST URL + token only in the console, so `setup` takes them as flags
 * (`--rest-url` `--rest-token`, the browser-fallback inputs the builder copies once), writes
 * them to `.env`, and verifies with a live REST ping. The token value is written to disk and
 * never echoed back to the agent.
 */
export function registerUpstashDomain(registry: CommandRegistry): void {
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
            else console.error(message);
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
            console.log('OK: Upstash setup complete.');
            console.log(`Wrote ${written.keysWritten.join(', ')} to ${written.path}`);
            console.log(verified ? '✓ Verified via Upstash REST ping.' : '⚠ Verification failed.');
          }
          return verified ? 0 : 1;
        },
      },
    },
  });
}

async function verifyUpstash(restUrl: string, restToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${restUrl.replace(/\/$/, '')}/ping`, {
      headers: { Authorization: `Bearer ${restToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
