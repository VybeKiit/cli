import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectAgent } from '../lib/agentDetection';
import { isInteractive } from '../prompts/tty';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = 3005;

/**
 * Resolve the VybeKiit monorepo root from the CLI location.
 *
 * @returns Absolute path to the monorepo root.
 * @example
 * const root = resolveMonorepoRoot();
 */
const resolveMonorepoRoot = (): string => join(HERE, '..', '..', '..');

/**
 * Open a URL in the user's default browser.
 *
 * @param url - URL to open.
 * @returns Promise that resolves after the browser open request is sent.
 * @example
 * await openBrowser('http://localhost:3005');
 */
const openBrowser = async (url: string): Promise<void> => {
  const { default: open } = await import('open');
  await open(url);
};

/**
 * Open the visual local dev sidecar.
 *
 * Detects the active AI agent, starts the Next.js app on :3005, and opens the
 * browser. Subsequent runs reuse the already-running server.
 *
 * @returns Process exit code from the local development website process.
 * @example
 * const exitCode = await runLocalDev();
 */
export const runLocalDev = async (): Promise<number> => {
  const root = resolveMonorepoRoot();

  try {
    await access(join(root, 'pnpm-workspace.yaml'));
  } catch {
    process.stderr.write('❌ vybekiit local-dev must be run from inside the VybeKiit monorepo.\n');
    return 1;
  }

  const agent = detectAgent();
  process.stdout.write('🎛️  VybeKiit Local Dev Console\n');
  process.stdout.write(
    `   Detected agent: ${agent.icon} ${agent.name} (${agent.mcpSupported ? 'MCP' : 'copy-to-clipboard'})\n`,
  );
  process.stdout.write(`   URL: http://localhost:${PORT}\n`);
  process.stdout.write('\n');

  const appDir = join(root, 'apps', 'localDevelopmentWebsite');
  const child = spawn('pnpm', ['dev'], {
    cwd: appDir,
    stdio: 'pipe',
    env: { ...process.env, VYBEKIIT_AGENT_ID: agent.id },
  });

  let opened = false;
  child.stdout.on('data', (data: Buffer) => {
    const line = data.toString();
    process.stdout.write(line);

    if (!opened && line.includes('Ready in')) {
      opened = true;
      if (isInteractive()) {
        openBrowser(`http://localhost:${PORT}`).catch(() => {
          process.stdout.write(
            `   Could not open browser automatically. Visit http://localhost:${PORT}\n`,
          );
        });
      }
    }
  });

  child.stderr.on('data', (data: Buffer) => {
    process.stderr.write(data.toString());
  });

  return new Promise((resolve) => {
    child.on('close', (code) => {
      const exitCode = code === null ? 0 : code;
      resolve(exitCode);
    });
  });
};
