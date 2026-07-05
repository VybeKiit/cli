import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectAgent } from '../lib/agentDetection';
import { isInteractive } from '../prompts/tty';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = 3005;

/** Resolve the VybeKiit monorepo root from the CLI location. */
function resolveMonorepoRoot(): string {
  return join(HERE, '..', '..', '..');
}

/** Open a URL in the user's default browser. */
async function openBrowser(url: string): Promise<void> {
  const { default: open } = await import('open');
  await open(url);
}

/**
 * `vybekiit local-dev` — open the visual local dev console.
 *
 * Detects the active AI agent, starts the Next.js app on :3020, and opens the
 * browser. Subsequent runs reuse the already-running server.
 */
export async function runLocalDev(): Promise<number> {
  const root = resolveMonorepoRoot();

  try {
    await access(join(root, 'pnpm-workspace.yaml'));
  } catch {
    console.error('❌ vybekiit local-dev must be run from inside the VybeKiit monorepo.');
    return 1;
  }

  const agent = detectAgent();
  console.log('🎛️  VybeKiit Local Dev Console');
  console.log(
    `   Detected agent: ${agent.icon} ${agent.name} (${agent.mcpSupported ? 'MCP' : 'copy-to-clipboard'})`,
  );
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('');

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
          console.log(`   Could not open browser automatically. Visit http://localhost:${PORT}`);
        });
      }
    }
  });

  child.stderr.on('data', (data: Buffer) => {
    process.stderr.write(data.toString());
  });

  return new Promise((resolve) => {
    child.on('close', (code) => resolve(code ?? 0));
  });
}
