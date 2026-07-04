import { spawn } from 'node:child_process';
import { isAbsolute, relative } from 'node:path';
import { VerifyGateFailedError } from './errors';
import type { VerbContext } from './types';

type VerifyGateStep = {
  args: string[];
  command: string;
  env?: NodeJS.ProcessEnv;
};

/**
 * Per-extension precondition for every push verb (ADR-0012). Runs the
 * standard release checks against the target extension and the global
 * manifest validator before any CWS write happens. Failing typecheck, test,
 * build, or manifest validation throws {@link VerifyGateFailedError}.
 *
 * This is intentionally separate from the interactive release-gate registry
 * in `scripts/cli/release-gates` (ADR-0014). That registry decides whether a
 * deploy flow can upload a package; this package-local gate protects direct
 * CWS draft/review/publish verbs even when an agent invokes them without the
 * CLI deploy wizard.
 *
 * Why we re-run the gate for each push verb instead of asking the developer
 * to run `pnpm verify:release` first: agents (Claude, Codex) call these
 * verbs directly. The gate has to be inside the verb so the agent surface
 * cannot bypass it by skipping a setup step.
 *
 * Why this reuses existing scripts instead of re-implementing checks: the
 * "follows the chrome api extension rules, best practices etc." requirement
 * already lives in `scripts/validate-extension-manifests.ts` plus the
 * extension's own `typecheck`/`test`/`build` scripts. Adding a second
 * checker here would split the source of truth.
 *
 * The commands are run sequentially (not in parallel) so the first failure
 * stops the chain — no point running tests if typecheck already fails.
 */
export async function runVerifyGate(ctx: VerbContext): Promise<void> {
  const log = ctx.log ?? console;
  const extensionDir = isAbsolute(ctx.extension.dir)
    ? relative(ctx.repoRoot, ctx.extension.dir)
    : ctx.extension.dir;
  const filter = `./${extensionDir}`;

  const steps: VerifyGateStep[] = [
    { args: ['--filter', filter, 'typecheck'], command: 'pnpm' },
    // The CWS CLI loads repo .env before running verbs. Keep production
    // NODE_ENV values from leaking into React/Vitest test utilities.
    { args: ['--filter', filter, 'test'], command: 'pnpm', env: { NODE_ENV: 'test' } },
    { args: ['--filter', filter, 'build'], command: 'pnpm' },
    { args: ['run', 'validate:manifests:release'], command: 'pnpm' },
  ];

  for (const step of steps) {
    const display = `${step.command} ${step.args.join(' ')}`;
    log.log(`[cws] gate: ${display}`);
    const exitCode = await runStep(step.command, step.args, ctx.repoRoot, step.env);
    if (exitCode !== 0) throw new VerifyGateFailedError(display, exitCode);
  }
}

/**
 * Spawn one step, inherit stdio so the developer sees real output, return
 * the exit code. We deliberately do not capture stdout/stderr — the
 * developer sees `pnpm`'s normal progress in their terminal, which is the
 * right experience for a gate.
 */
function runStep(
  command: string,
  args: readonly string[],
  cwd: string,
  env: NodeJS.ProcessEnv = {},
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  });
}
