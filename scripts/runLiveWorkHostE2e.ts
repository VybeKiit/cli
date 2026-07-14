/**
 * One-shot real host Live work CLI e2e: Cloudflare Pages demo deploy (no pin).
 * Usage: pnpm exec tsx scripts/runLiveWorkHostE2e.ts  (from cli/)
 * Requires wrangler login. Network only — not part of default CI.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runLiveWorkHost } from '../src/commands/liveWorkHostCmd';

process.env.VYBEKIIT_SKIP_GATE = '1';

const cwd = mkdtempSync(join(tmpdir(), 'vybekiit-cli-live-host-'));

try {
  const result = await runLiveWorkHost([`--cwd=${cwd}`, '--mode=demo', '--fresh', '--no-pin']);
  process.stdout.write(`${result.json}\n`);
  process.stdout.write(`exitCode=${result.exitCode}\n`);

  if (result.exitCode === 0) {
    const parsed = JSON.parse(result.json) as {
      ok?: boolean;
      provider?: string;
      url?: string;
      pinKeys?: string[];
    };
    process.stdout.write(`provider=${String(parsed.provider)}\n`);
    process.stdout.write(
      `hasPagesUrl=${String(typeof parsed.url === 'string' && parsed.url.includes('pages.dev'))}\n`,
    );
    process.stdout.write(
      `secretNotInJson=${String(!(result.json.includes('apiToken') || result.json.includes('CLOUDFLARE_API')))}\n`,
    );

    // Best-effort delete demo project if name is in pinKeys path via CLOUDFLARE_PROJECT_NAME in result
    // Public result may not include project id — parse from url hostname
    if (typeof parsed.url === 'string') {
      try {
        const host = new URL(parsed.url).hostname;
        const project = host.replace(/\.pages\.dev$/, '');
        if (project.length > 0 && project.startsWith('vybekiit-lw')) {
          const { execFile } = await import('node:child_process');
          const { promisify } = await import('node:util');
          const execFileAsync = promisify(execFile);
          await execFileAsync('wrangler', ['pages', 'project', 'delete', project, '--yes']);
          process.stdout.write(`deletedProject=${project}\n`);
        }
      } catch {
        process.stdout.write('deletedProject=false\n');
      }
    }
  }

  process.exitCode = result.exitCode;
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
