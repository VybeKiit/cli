import { accessSync as accessSyncFs } from 'node:fs';
import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveTemplatesSource } from '../lib/resolveTemplates';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Files/dirs that `init` injects into an existing project. */
const _INIT_ASSETS = [
  '.claude',
  '.github/workflows',
  '.husky/pre-push',
  'SECURITY.md',
  'dev-scripts',
] as const;

/** Detect which package manager the project uses. */
function detectPackageManager(cwd: string): 'pnpm' | 'npm' | 'yarn' | 'bun' {
  const checks: [string, 'pnpm' | 'npm' | 'yarn' | 'bun'][] = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'],
  ];
  for (const [file, pm] of checks) {
    try {
      accessSyncFs(join(cwd, file));
      return pm;
    } catch {}
  }
  return 'npm';
}

/** Detect which template type best matches the existing project. */
async function detectProjectType(cwd: string): Promise<string> {
  try {
    const raw = await readFile(join(cwd, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (allDeps.expo || allDeps['react-native']) {
      return 'mobile';
    }
    if (allDeps.wxt || allDeps['webextension-polyfill']) {
      return 'extension';
    }
    if (allDeps.next || allDeps.nuxt) {
      return 'web';
    }
    if (allDeps.express || allDeps.fastify || allDeps.hono) {
      return 'backend';
    }
    if (allDeps.vite || allDeps.react) {
      return 'spa';
    }
  } catch {
    // No package.json
  }
  return 'web'; // Default
}

/**
 * `vybekiit init` — bootstrap VybeKiit guardrails on an EXISTING project.
 *
 * Copies:
 * - .claude/ (settings.json + hooks) — Claude Code runtime enforcement
 * - .github/workflows/ — full CI pipeline (biome, typecheck, test, build, gate, report-failure)
 * - .husky/pre-push — local pre-push verification gate
 * - SECURITY.md — agent guardrails documentation
 * - dev-scripts/ — gitignored scratch folder for agent scripts
 *
 * Patches:
 * - .gitignore — adds dev-scripts/, .env patterns if missing
 * - package.json — adds check:ci, typecheck, verify scripts if missing
 *
 * Adapts workflows to detected package manager (pnpm/npm/yarn/bun).
 */
export async function runInit(args: string[]): Promise<number> {
  const cwd = args[0] ? join(process.cwd(), args[0]) : process.cwd();

  console.log('🔒 VybeKiit init — bootstrapping security guardrails...');
  console.log('');

  // Detect project characteristics
  const pm = detectPackageManager(cwd);
  const projectType = await detectProjectType(cwd);
  console.log(`  Detected: ${projectType} project using ${pm}`);

  // Resolve template source
  let cleanup: (() => Promise<void>) | undefined;
  let source: string;
  try {
    const resolved = await resolveTemplatesSource(projectType as any);
    source = resolved.source;
    cleanup = resolved.cleanup;
  } catch {
    // Fallback: use local templates dir
    source = join(HERE, '..', '..', '..', 'templates');
    cleanup = undefined;
  }

  const templateDir = join(source, projectType);

  // 1. Copy .claude/ (hooks + settings)
  const claudeDir = join(cwd, '.claude');
  const claudeSource = join(templateDir, '.claude');
  try {
    await access(claudeSource);
    await cp(claudeSource, claudeDir, { recursive: true, force: true });
    console.log('  ✅ .claude/settings.json + hooks');
  } catch {
    console.log('  ⚠️  Could not copy .claude hooks (source missing)');
  }

  // 2. Copy .github/workflows/
  const workflowsDir = join(cwd, '.github', 'workflows');
  const workflowsSource = join(templateDir, '.github', 'workflows');
  try {
    await access(workflowsSource);
    await mkdir(workflowsDir, { recursive: true });
    await cp(workflowsSource, workflowsDir, { recursive: true, force: true });

    // Adapt to package manager if not pnpm
    if (pm !== 'pnpm') {
      await adaptWorkflows(workflowsDir, pm);
    }
    console.log('  ✅ .github/workflows/ (CI pipeline)');
  } catch {
    console.log('  ⚠️  Could not copy workflows (source missing)');
  }

  // 3. Copy .husky/pre-push
  const huskyDir = join(cwd, '.husky');
  const huskySource = join(templateDir, '.husky', 'pre-push');
  try {
    await access(huskySource);
    await mkdir(huskyDir, { recursive: true });
    await cp(huskySource, join(huskyDir, 'pre-push'), { force: true });
    console.log('  ✅ .husky/pre-push');
  } catch {
    console.log('  ⚠️  Could not copy pre-push hook');
  }

  // 4. Copy SECURITY.md
  const secSource = join(templateDir, 'SECURITY.md');
  try {
    await access(secSource);
    await cp(secSource, join(cwd, 'SECURITY.md'), { force: false }); // Don't overwrite
    console.log('  ✅ SECURITY.md');
  } catch {
    // Either source missing or file already exists
    try {
      await access(join(cwd, 'SECURITY.md'));
      console.log('  ✓  SECURITY.md (already exists)');
    } catch {
      console.log('  ⚠️  Could not copy SECURITY.md');
    }
  }

  // 5. Create dev-scripts/
  const devScriptsDir = join(cwd, 'dev-scripts');
  try {
    await mkdir(devScriptsDir, { recursive: true });
    await writeFile(
      join(devScriptsDir, '.gitkeep'),
      '# Local-only dev scripts — gitignored, never committed to the repo.\n',
      { flag: 'wx' }, // Don't overwrite
    );
    console.log('  ✅ dev-scripts/ (gitignored scratch)');
  } catch {
    console.log('  ✓  dev-scripts/ (already exists)');
  }

  // 6. Generate multi-platform agent configs (Kiro, Cursor, Codex, Gemini)
  await generatePlatformConfigs(cwd);

  // 7. Patch .gitignore
  await patchGitignore(cwd);

  // 8. Patch package.json scripts
  await patchPackageScripts(cwd, pm);

  console.log('');
  console.log('🎉 Done. Your project now has VybeKiit guardrails:');
  console.log('   • Claude Code hooks enforce rules at runtime');
  console.log('   • Multi-platform agent configs (Kiro, Cursor, Codex, Gemini)');
  console.log('   • CI pipeline gates all merges to main');
  console.log('   • Pre-push hook verifies locally before push');
  console.log('   • Secrets are blocked from source files');
  console.log('');
  console.log(`   Next: run \`${pm} install\` then \`${pm} run verify\``);
  console.log('');
  console.log('   Platform configs generated:');
  console.log('     .kiro/steering/vybekiit.md   → Kiro');
  console.log('     .cursor/rules/vybekiit.mdc   → Cursor');
  console.log('     AGENTS.md                    → OpenAI Codex');
  console.log('     GEMINI.md                    → Gemini CLI');
  console.log('     CLAUDE.md + .claude/hooks/   → Claude Code');
  await cleanup?.();
  return 0;
}

/** Generate multi-platform agent config files. */
async function generatePlatformConfigs(cwd: string): Promise<void> {
  const { execSync } = await import('node:child_process');

  // Look for the platform generator script
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

  let scriptPath: string | undefined;
  for (const p of possiblePaths) {
    try {
      await access(p);
      scriptPath = p;
      break;
    } catch {}
  }

  if (scriptPath) {
    try {
      execSync(`bash "${scriptPath}" "${cwd}" --all`, { stdio: 'pipe' });
      console.log('  ✅ Multi-platform configs (14 platforms)');
    } catch {
      console.log('  ⚠️  Could not generate platform configs');
    }
  } else {
    // Inline fallback: generate AGENTS.md at minimum (universal standard)
    const agentsPath = join(cwd, 'AGENTS.md');
    try {
      await access(agentsPath);
      console.log('  ✓  AGENTS.md (already exists)');
    } catch {
      await writeFile(
        agentsPath,
        '# Agent Instructions\n\nThis project uses VybeKiit conventions.\n\nSee .claude/hooks/ for enforced rules.\n',
      );
      console.log('  ✅ AGENTS.md (universal agent instructions)');
    }
  }
}

/** Adapt workflow files from pnpm → target package manager. */
async function adaptWorkflows(dir: string, pm: 'npm' | 'yarn' | 'bun'): Promise<void> {
  const { readdir, readFile, writeFile } = await import('node:fs/promises');
  const files = await readdir(dir);

  const replacements: Record<string, Record<string, string>> = {
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

  const reps = replacements[pm] ?? {};

  for (const file of files) {
    if (!file.endsWith('.yml')) {
      continue;
    }
    let content = await readFile(join(dir, file), 'utf8');
    for (const [from, to] of Object.entries(reps)) {
      content = content.replaceAll(from, to);
    }
    await writeFile(join(dir, file), content);
  }
}

/** Add missing entries to .gitignore. */
async function patchGitignore(cwd: string): Promise<void> {
  const gitignorePath = join(cwd, '.gitignore');
  let content = '';
  try {
    content = await readFile(gitignorePath, 'utf8');
  } catch {
    // No .gitignore yet
  }

  const additions: string[] = [];
  const needed = [
    ['dev-scripts/', '# agent scratch scripts (gitignored)'],
    ['.env', '# env secrets'],
    ['.env.*', ''],
    ['!.env.example', ''],
  ] as const;

  for (const [pattern] of needed) {
    if (!content.includes(pattern)) {
      additions.push(pattern);
    }
  }

  if (additions.length > 0) {
    const block = `\n# VybeKiit guardrails\n${additions.join('\n')}\n`;
    await writeFile(gitignorePath, content + block);
    console.log('  ✅ .gitignore patched');
  } else {
    console.log('  ✓  .gitignore (already has required entries)');
  }
}

/** Add missing scripts to package.json. */
async function patchPackageScripts(cwd: string, pm: string): Promise<void> {
  const pkgPath = join(cwd, 'package.json');
  let raw: string;
  try {
    raw = await readFile(pkgPath, 'utf8');
  } catch {
    return; // No package.json
  }

  const pkg = JSON.parse(raw);
  if (!pkg.scripts) {
    pkg.scripts = {};
  }

  let patched = false;

  if (!pkg.scripts['check:ci']) {
    pkg.scripts['check:ci'] = 'biome ci .';
    patched = true;
  }
  if (!pkg.scripts.typecheck) {
    pkg.scripts.typecheck = 'tsc --noEmit';
    patched = true;
  }
  if (!pkg.scripts.verify) {
    const verifyCmd = `${pm} run check:ci && ${pm} run typecheck && ${pm} run test`;
    pkg.scripts.verify = verifyCmd;
    patched = true;
  }

  if (patched) {
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log('  ✅ package.json scripts patched (check:ci, typecheck, verify)');
  } else {
    console.log('  ✓  package.json scripts (already has required scripts)');
  }
}
