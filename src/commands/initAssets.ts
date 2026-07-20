import { execFile } from 'node:child_process';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { type PackageManager, pathExists } from './initTypes';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Copy Claude Code settings and hooks from the selected template.
 *
 * @param cwd - Target project directory.
 * @param templateDir - Resolved template source directory.
 * @returns Promise that resolves after the copy or visible warning.
 */
export const copyClaudeHooks = async (cwd: string, templateDir: string): Promise<void> => {
  const claudeSource = join(templateDir, '.claude');
  if (!(await pathExists(claudeSource))) {
    process.stdout.write('  ⚠️  Could not copy .claude hooks (source missing)\n');
    return;
  }

  await cp(claudeSource, join(cwd, '.claude'), { recursive: true, force: true });
  process.stdout.write('  ✅ .claude/settings.json + hooks\n');
};

/**
 * Copy and adapt GitHub workflow files from the selected template.
 *
 * @param cwd - Target project directory.
 * @param templateDir - Resolved template source directory.
 * @param pm - Detected package manager for workflow commands.
 * @returns Promise that resolves after workflow files are copied.
 */
export const copyWorkflows = async (
  cwd: string,
  templateDir: string,
  pm: PackageManager,
): Promise<void> => {
  const workflowsDir = join(cwd, '.github', 'workflows');
  const workflowsSource = join(templateDir, '.github', 'workflows');
  if (!(await pathExists(workflowsSource))) {
    process.stdout.write('  ⚠️  Could not copy workflows (source missing)\n');
    return;
  }

  await mkdir(workflowsDir, { recursive: true });
  await cp(workflowsSource, workflowsDir, { recursive: true, force: true });
  if (pm !== 'pnpm') {
    await adaptWorkflows(workflowsDir, pm);
  }
  process.stdout.write('  ✅ .github/workflows/ (CI pipeline)\n');
};

/**
 * Copy the pre-push hook from the selected template.
 *
 * @param cwd - Target project directory.
 * @param templateDir - Resolved template source directory.
 * @returns Promise that resolves after the hook is copied or warned.
 */
export const copyPrePushHook = async (cwd: string, templateDir: string): Promise<void> => {
  const huskySource = join(templateDir, '.husky', 'pre-push');
  if (!(await pathExists(huskySource))) {
    process.stdout.write('  ⚠️  Could not copy pre-push hook\n');
    return;
  }

  const huskyDir = join(cwd, '.husky');
  await mkdir(huskyDir, { recursive: true });
  await cp(huskySource, join(huskyDir, 'pre-push'), { force: true });
  process.stdout.write('  ✅ .husky/pre-push\n');
};

/**
 * Copy SECURITY.md without overwriting a project-owned file.
 *
 * @param cwd - Target project directory.
 * @param templateDir - Resolved template source directory.
 * @returns Promise that resolves after SECURITY.md is copied or warned.
 */
export const copySecurityFile = async (cwd: string, templateDir: string): Promise<void> => {
  const dest = join(cwd, 'SECURITY.md');
  if (await pathExists(dest)) {
    process.stdout.write('  ✓  SECURITY.md (already exists)\n');
    return;
  }

  const source = join(templateDir, 'SECURITY.md');
  if (!(await pathExists(source))) {
    process.stdout.write('  ⚠️  Could not copy SECURITY.md\n');
    return;
  }

  await cp(source, dest, { force: false });
  process.stdout.write('  ✅ SECURITY.md\n');
};

/**
 * Create the local-only dev-scripts scratch directory.
 *
 * @param cwd - Target project directory.
 * @returns Promise that resolves after the directory is ready.
 */
export const createDevScriptsDir = async (cwd: string): Promise<void> => {
  const devScriptsDir = join(cwd, 'dev-scripts');
  const gitkeepPath = join(devScriptsDir, '.gitkeep');
  await mkdir(devScriptsDir, { recursive: true });
  if (await pathExists(gitkeepPath)) {
    process.stdout.write('  ✓  dev-scripts/ (already exists)\n');
    return;
  }

  await writeFile(
    gitkeepPath,
    '# Local-only dev scripts - gitignored, never committed to the repo.\n',
    { flag: 'wx' },
  );
  process.stdout.write('  ✅ dev-scripts/ (gitignored scratch)\n');
};

/**
 * Generate multi-platform agent config files when the generator script is available.
 *
 * @param cwd - Target project directory.
 * @returns Promise that resolves after configs are generated or minimally seeded.
 */
export const generatePlatformConfigs = async (cwd: string): Promise<void> => {
  const possiblePaths = [
    join(cwd, '.claude', 'platforms', 'generate-platform-configs.sh'),
    join(
      HERE,
      '..',
      '..',
      '..',
      'packages',
      'agentKit',
      'src',
      'platforms',
      'generate-platform-configs.sh',
    ),
  ];
  const checks = await Promise.all(
    possiblePaths.map(async (candidatePath) =>
      (await pathExists(candidatePath)) ? candidatePath : null,
    ),
  );
  const generatorPath = checks.find((path): path is string => path !== null);

  if (generatorPath !== undefined) {
    try {
      await execFileAsync('bash', [generatorPath, cwd, '--all']);
      process.stdout.write('  ✅ Multi-platform configs (14 platforms)\n');
      return;
    } catch {
      process.stdout.write('  ⚠️  Could not generate platform configs\n');
      return;
    }
  }

  const agentsPath = join(cwd, 'AGENTS.md');
  if (await pathExists(agentsPath)) {
    process.stdout.write('  ✓  AGENTS.md (already exists)\n');
    return;
  }

  await writeFile(
    agentsPath,
    '# Agent Instructions\n\nThis project uses VybeKiit conventions.\n\nSee .claude/hooks/ for enforced rules.\n',
  );
  process.stdout.write('  ✅ AGENTS.md (universal agent instructions)\n');
};

/**
 * Adapt workflow files from pnpm commands to the detected package manager.
 *
 * @param dir - Directory containing workflow YAML files.
 * @param pm - Non-pnpm package manager to render into workflow commands.
 * @returns Promise that resolves after workflow files are rewritten.
 */
const adaptWorkflows = async (dir: string, pm: Exclude<PackageManager, 'pnpm'>): Promise<void> => {
  const files = await readdir(dir);
  const replacements: Record<Exclude<PackageManager, 'pnpm'>, Record<string, string>> = {
    npm: {
      'pnpm install --frozen-lockfile': 'npm ci',
      'pnpm run': 'npm run',
      'pnpm test': 'npm test',
      'pnpm/action-setup@v4': '# pnpm not needed for npm',
      'uses: pnpm/action-setup@v4\n        with:\n          version: 10\n': '',
    },
    yarn: {
      'pnpm install --frozen-lockfile': 'yarn install --frozen-lockfile',
      'pnpm run': 'yarn',
      'pnpm test': 'yarn test',
      'pnpm/action-setup@v4': '# pnpm not needed for yarn',
    },
    bun: {
      'pnpm install --frozen-lockfile': 'bun install --frozen-lockfile',
      'pnpm run': 'bun run',
      'pnpm test': 'bun test',
      'pnpm/action-setup@v4': '# pnpm not needed for bun',
      'cache: pnpm': 'cache: bun',
    },
  };
  const workflowFiles = files.filter((file) => file.endsWith('.yml'));

  await Promise.all(
    workflowFiles.map(async (file) => {
      const path = join(dir, file);
      let content = await readFile(path, 'utf8');
      for (const [from, to] of Object.entries(replacements[pm])) {
        content = content.replaceAll(from, to);
      }
      await writeFile(path, content);
    }),
  );
};
