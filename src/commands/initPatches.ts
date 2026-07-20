import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type PackageManager, pathExists, readInitPackageJson } from './initTypes';

/**
 * Add missing VybeKiit guardrail entries to `.gitignore`.
 *
 * @param cwd - Target project directory.
 * @returns Promise that resolves after `.gitignore` is patched.
 */
export const patchGitignore = async (cwd: string): Promise<void> => {
  const gitignorePath = join(cwd, '.gitignore');
  const content = (await pathExists(gitignorePath)) ? await readFile(gitignorePath, 'utf8') : '';
  const needed = ['dev-scripts/', '.env', '.env.*', '!.env.example'];
  const additions = needed.filter((pattern) => !content.includes(pattern));

  if (additions.length > 0) {
    await writeFile(gitignorePath, `${content}\n# VybeKiit guardrails\n${additions.join('\n')}\n`);
    process.stdout.write('  ✅ .gitignore patched\n');
    return;
  }

  process.stdout.write('  ✓  .gitignore (already has required entries)\n');
};

/**
 * Add missing verification scripts to package.json.
 *
 * @param cwd - Target project directory.
 * @param pm - Detected package manager used to compose the verify command.
 * @returns Promise that resolves after package scripts are patched.
 */
export const patchPackageScripts = async (cwd: string, pm: PackageManager): Promise<void> => {
  const pkgPath = join(cwd, 'package.json');
  const pkg = await readInitPackageJson(cwd);
  if (pkg === null) {
    process.stdout.write('  ⚠️  package.json scripts skipped (package.json missing)\n');
    return;
  }

  const scripts = pkg.scripts === undefined ? {} : { ...pkg.scripts };
  const patchedScripts = {
    ...scripts,
    ...('check:ci' in scripts ? {} : { 'check:ci': 'biome ci .' }),
    ...(scripts.typecheck === undefined ? { typecheck: 'tsc --noEmit' } : {}),
    ...(scripts.verify === undefined
      ? { verify: `${pm} run check:ci && ${pm} run typecheck && ${pm} run test` }
      : {}),
  };

  if (Object.keys(patchedScripts).length !== Object.keys(scripts).length) {
    await writeFile(pkgPath, `${JSON.stringify({ ...pkg, scripts: patchedScripts }, null, 2)}\n`);
    process.stdout.write('  ✅ package.json scripts patched (check:ci, typecheck, verify)\n');
    return;
  }

  process.stdout.write('  ✓  package.json scripts (already has required scripts)\n');
};
