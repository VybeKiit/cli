import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import type { VerbContext } from './types';

/**
 * Build + zip the target extension and return the freshest zip in the
 * shared `.output/<extension>/` folder. WXT writes zips outside the
 * extension workspace, so callers must not assume `extensions/foo/.output`.
 */
export async function buildAndFindZip(ctx: VerbContext): Promise<string> {
  const extPath = resolve(ctx.repoRoot, ctx.extension.dir);
  await runIn(extPath, 'pnpm', ['build']);
  await runIn(extPath, 'pnpm', ['zip']);
  return findFreshestZip(ctx);
}

/**
 * Maintains find freshest zip behavior at the Chrome Web Store automation module boundary.
 */
export function findFreshestZip(ctx: VerbContext): string {
  const outputDirs = [
    resolve(ctx.repoRoot, '.output', ctx.extension.key),
    resolve(ctx.repoRoot, dirname(ctx.extension.dir), '.output', ctx.extension.key),
    resolve(ctx.repoRoot, ctx.extension.dir, '.output'),
  ];

  const zips = outputDirs.flatMap((outputDir) => {
    if (!existsSync(outputDir)) return [];
    return readdirSync(outputDir)
      .filter((file) => file.endsWith('.zip'))
      .map((file) => join(outputDir, file));
  });

  const zip = zips.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
  if (!zip) {
    throw new Error(
      `No zip found for ${ctx.extension.key}. Run \`pnpm --filter ${ctx.extension.key} zip\`.`,
    );
  }
  return zip;
}

function runIn(cwd: string, command: string, args: readonly string[]): Promise<void> {
  return new Promise((resolveStep, rejectStep) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.on('error', rejectStep);
    child.on('close', (code) => {
      if (code === 0) resolveStep();
      else rejectStep(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}
