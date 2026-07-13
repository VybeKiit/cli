/**
 * One-shot real Live work CLI e2e: claimable Neon → pin temp .env.
 * Usage: pnpm exec tsx scripts/runLiveWorkDataE2e.ts  (from cli/)
 * Network only — not part of default CI.
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runLiveWorkData } from '../src/commands/liveWorkDataCmd';

process.env.VYBEKIIT_SKIP_GATE = '1';

const cwd = mkdtempSync(join(tmpdir(), 'vybekiit-cli-live-work-'));

try {
  const result = await runLiveWorkData([`--cwd=${cwd}`, '--mode=demo', '--fresh']);
  process.stdout.write(`${result.json}\n`);
  process.stdout.write(`exitCode=${result.exitCode}\n`);

  if (result.exitCode === 0) {
    const env = readFileSync(join(cwd, '.env'), 'utf8');
    const keys = env
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => line.split('=')[0] ?? '');
    process.stdout.write(`pinKeysWritten=${JSON.stringify(keys)}\n`);
    process.stdout.write(`hasDatabaseUrl=${String(env.includes('DATABASE_URL=postgresql://'))}\n`);
    process.stdout.write(`hasAuthCompanion=${String(env.includes('AUTH_PROVIDER=better-auth'))}\n`);
    process.stdout.write(`secretNotInJson=${String(!result.json.includes('postgresql://'))}\n`);
  }

  process.exitCode = result.exitCode;
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
