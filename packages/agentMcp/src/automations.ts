import { spawn } from 'node:child_process';
import { accessSync, constants, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import {
  type AutomationCatalogEntry,
  getAutomation,
  listAutomationCatalog,
} from '@vybekiit/browser-automation/cli/catalog';
import { type PageResult, paginate, scoreQuery } from './uiCatalog';

/**
 * Extra search tokens so agents can find domains by product name.
 *
 * @param domain - Registry domain name.
 * @returns Synonym tokens for fuzzy search.
 * @example
 * domainSearchHints('payments/ls') // includes 'lemon', 'squeezy'
 */
const domainSearchHints = (domain: string): readonly string[] => {
  if (domain === 'ls' || domain.includes('ls') || domain.includes('payments')) {
    return ['lemon', 'squeezy', 'lemon-squeezy', 'payments', 'checkout', 'webhook'];
  }
  if (domain === 'extension' || domain === 'cws') {
    return ['chrome', 'web', 'store', 'cws', 'extension', 'listing'];
  }
  if (domain.includes('namecheap') || domain === 'nc') {
    return ['namecheap', 'registrar', 'domain', 'dns'];
  }
  if (domain.includes('godaddy') || domain === 'gd') {
    return ['godaddy', 'registrar', 'domain'];
  }
  if (domain.includes('supabase') || domain === 'db') {
    return ['supabase', 'postgres', 'database'];
  }
  if (domain.includes('cloudflare') || domain === 'cf') {
    return ['cloudflare', 'workers', 'wrangler', 'token'];
  }
  if (domain.includes('neon')) {
    return ['neon', 'postgres', 'database'];
  }
  if (domain.includes('railway')) {
    return ['railway', 'hosting', 'deploy'];
  }
  if (domain.includes('vercel')) {
    return ['vercel', 'hosting', 'deploy'];
  }
  if (domain.includes('github')) {
    return ['github', 'gh', 'token'];
  }
  if (domain.includes('google')) {
    return ['google', 'oauth', 'cloud', 'console'];
  }
  return [];
};

/** Slim automation row for search results. */
export type SlimAutomation = {
  readonly id: string;
  readonly domain: string;
  readonly command: string;
  readonly description: string;
  readonly usage: string;
  readonly aliases: readonly string[];
  readonly score: number;
};

/** Result of planning or running an automation. */
export type AutomationRunResult = {
  readonly ok: boolean;
  readonly dryRun: boolean;
  readonly argv: readonly string[];
  readonly cwd: string;
  readonly bin: string;
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
};

const DEFAULT_RUN_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_CAPTURE_CHARS = 12_000;

/**
 * Resolve the project root used as cwd for automation runs.
 *
 * @returns Env override or process.cwd().
 * @example
 * resolveProjectRoot();
 */
export const resolveProjectRoot = (): string => process.env.VYBEKIIT_PROJECT_ROOT ?? process.cwd();

/**
 * Probe whether a file path is executable / readable.
 *
 * @param path - Absolute path to probe.
 * @returns True when the path exists and is readable.
 * @example
 * pathReadable('/usr/bin/node');
 */
const pathReadable = (path: string): boolean => {
  try {
    accessSync(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

/**
 * Resolve the `vybekiit-automate` binary so agents can run it from any workspace.
 *
 * Resolution order:
 * 1. `VYBEKIIT_AUTOMATE_BIN`
 * 2. package `bin` via `createRequire` on `@vybekiit/browser-automation`
 * 3. monorepo-relative `packages/browserAutomation/dist/cli/index.cjs` from project root
 * 4. bare `vybekiit-automate` (PATH)
 *
 * @param projectRoot - Project root used for monorepo-relative fallback.
 * @returns Absolute path or bare command name.
 * @example
 * resolveAutomateBin(process.cwd());
 */
export const resolveAutomateBin = (projectRoot: string = resolveProjectRoot()): string => {
  if (
    process.env.VYBEKIIT_AUTOMATE_BIN !== undefined &&
    process.env.VYBEKIIT_AUTOMATE_BIN.length > 0
  ) {
    return process.env.VYBEKIIT_AUTOMATE_BIN;
  }

  try {
    const require = createRequire(import.meta.url);
    const pkgJson = require.resolve('@vybekiit/browser-automation/package.json');
    const binPath = join(dirname(pkgJson), 'dist', 'cli', 'index.cjs');
    if (pathReadable(binPath)) {
      return binPath;
    }
  } catch {
    /* package not resolvable from this module graph */
  }

  const monorepoCandidates = [
    join(projectRoot, 'packages', 'browserAutomation', 'dist', 'cli', 'index.cjs'),
    join(projectRoot, '..', 'packages', 'browserAutomation', 'dist', 'cli', 'index.cjs'),
    join(projectRoot, '../..', 'packages', 'browserAutomation', 'dist', 'cli', 'index.cjs'),
  ];
  for (const candidate of monorepoCandidates) {
    if (existsSync(candidate) && pathReadable(candidate)) {
      return candidate;
    }
  }

  return 'vybekiit-automate';
};

/**
 * Fuzzy-search automation verbs with cursor pagination.
 *
 * @param query - Free-text query (empty = list all).
 * @param options - Optional limit and cursor.
 * @returns Page of slim automation rows.
 * @example
 * searchAutomations('lemon squeezy setup', { limit: 5 });
 */
export const searchAutomations = (
  query: string,
  options?: { readonly limit?: number; readonly cursor?: string },
): PageResult<SlimAutomation> => {
  const trimmed = query.trim();
  const ranked = listAutomationCatalog()
    .map((entry) => {
      // Loose match: agents type product names ("lemon squeezy") while catalog says "ls".
      const score =
        trimmed.length === 0
          ? 1
          : scoreQuery(
              trimmed,
              [
                entry.id,
                entry.domain,
                entry.command,
                entry.description,
                entry.usage,
                ...entry.aliases,
                ...domainSearchHints(entry.domain),
              ],
              'any',
            );
      return {
        id: entry.id,
        domain: entry.domain,
        command: entry.command,
        description: entry.description,
        usage: entry.usage,
        aliases: entry.aliases,
        score,
      } satisfies SlimAutomation;
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  return paginate(ranked, options);
};

/**
 * Look up one automation by id or domain + command.
 *
 * @param domainOrId - Domain, alias, or `domain:command` id.
 * @param command - Command when domainOrId is only a domain.
 * @returns Catalog entry or undefined.
 * @example
 * lookupAutomation('ls', 'setup');
 */
export const lookupAutomation = (
  domainOrId: string,
  command?: string,
): AutomationCatalogEntry | undefined => getAutomation(domainOrId, command);

/**
 * Build argv for `vybekiit-automate` (always agent-friendly `--json`).
 *
 * @param domain - Domain name or alias.
 * @param command - Verb name.
 * @param args - Extra domain-specific flags (e.g. `--name=Kit`).
 * @param options - Optional CDP / profile / yes flags.
 * @returns Full argv after the binary.
 * @example
 * buildAutomationArgv('ls', 'setup', ['--name=Kit', '--price-cents=2900']);
 */
export const buildAutomationArgv = (
  domain: string,
  command: string,
  args: readonly string[] = [],
  options?: {
    readonly yes?: boolean;
    readonly cdp?: string;
    readonly profile?: string;
  },
): readonly string[] => {
  const argv: string[] = ['--json'];
  if (options?.yes !== false) {
    argv.push('--yes');
  }
  if (options?.cdp !== undefined && options.cdp.length > 0) {
    argv.push(`--cdp=${options.cdp}`);
  }
  if (options?.profile !== undefined && options.profile.length > 0) {
    argv.push(`--profile=${options.profile}`);
  }
  argv.push(domain, command, ...args);
  return argv;
};

/**
 * Truncate captured process output for MCP context budgets.
 *
 * @param text - Raw stdout/stderr.
 * @returns Truncated text with a marker when clipped.
 * @example
 * truncateCapture('x'.repeat(20_000));
 */
const truncateCapture = (text: string): string => {
  if (text.length <= MAX_CAPTURE_CHARS) {
    return text;
  }
  return `${text.slice(0, MAX_CAPTURE_CHARS)}\n…[truncated ${text.length - MAX_CAPTURE_CHARS} chars]`;
};

/**
 * Plan (dry-run) or execute a browser automation verb via the CLI bin.
 *
 * @param domain - Domain name or alias (`ls`, `extension`, `nc`, …).
 * @param command - Verb (`setup`, `standby`, …).
 * @param options - Args, dry-run, timeout, cwd overrides.
 * @returns Run result including argv and captured output.
 * @example
 * await runAutomation('ls', 'standby', { dryRun: true });
 */
export const runAutomation = async (
  domain: string,
  command: string,
  options?: {
    readonly args?: readonly string[];
    readonly dryRun?: boolean;
    readonly yes?: boolean;
    readonly cdp?: string;
    readonly profile?: string;
    readonly cwd?: string;
    readonly timeoutMs?: number;
  },
): Promise<AutomationRunResult> => {
  const entry = getAutomation(domain, command);
  if (entry === undefined) {
    return {
      ok: false,
      dryRun: options?.dryRun === true,
      argv: [],
      cwd: options?.cwd ?? resolveProjectRoot(),
      bin: resolveAutomateBin(options?.cwd ?? resolveProjectRoot()),
      exitCode: 1,
      stdout: '',
      stderr: `Unknown automation: ${domain} ${command}. Use search_automations first.`,
      timedOut: false,
    };
  }

  const cwd = options?.cwd ?? resolveProjectRoot();
  const bin = resolveAutomateBin(cwd);
  // Prefer the caller's domain/alias so short forms (ls, nc) still work.
  // Catalog entry already validated domain+command exist.
  const runArgv = buildAutomationArgv(domain, entry.command, options?.args ?? [], {
    ...(options?.yes === undefined ? {} : { yes: options.yes }),
    ...(options?.cdp === undefined ? {} : { cdp: options.cdp }),
    ...(options?.profile === undefined ? {} : { profile: options.profile }),
  });

  if (options?.dryRun === true) {
    return {
      ok: true,
      dryRun: true,
      argv: runArgv,
      cwd,
      bin,
      exitCode: 0,
      stdout: JSON.stringify({ planned: true, bin, cwd, argv: runArgv }, null, 2),
      stderr: '',
      timedOut: false,
    };
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_RUN_TIMEOUT_MS;
  const isJsBin = bin.endsWith('.js') || bin.endsWith('.cjs') || bin.endsWith('.mjs');
  const spawnCommand = isJsBin ? process.execPath : bin;
  const spawnArgs = isJsBin ? [bin, ...runArgv] : [...runArgv];

  return await new Promise<AutomationRunResult>((resolve) => {
    const child = spawn(spawnCommand, spawnArgs, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000).unref();
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdout += String(chunk);
    });
    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        dryRun: false,
        argv: runArgv,
        cwd,
        bin,
        exitCode: 1,
        stdout: truncateCapture(stdout),
        stderr: truncateCapture(
          `${stderr}\n${error instanceof Error ? error.message : String(error)}`.trim(),
        ),
        timedOut,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      const exitCode = code ?? (timedOut ? 124 : 1);
      resolve({
        ok: exitCode === 0 && !timedOut,
        dryRun: false,
        argv: runArgv,
        cwd,
        bin,
        exitCode,
        stdout: truncateCapture(stdout),
        stderr: truncateCapture(stderr),
        timedOut,
      });
    });
  });
};
