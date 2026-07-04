import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectSurface } from '../lib/inferProjectSurface';
import type { Platform } from './toolchain';

export interface NativeProjectSetupResult {
  readonly lines: readonly string[];
}

function runCommand(
  log: Console,
  label: string,
  cwd: string,
  command: string,
  args: string[],
): boolean {
  log.log(`[doctor] ${label}: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  return result.status === 0;
}

/**
 * One-time project steps after native CLIs are present — `pod install`, `wxt prepare`, etc.
 * Idempotent: skips when folders or generated output already exist.
 */
export function runNativeProjectSetup(
  cwd: string,
  surface: ProjectSurface,
  platform: Platform,
  log: Console = console,
): NativeProjectSetupResult {
  const lines: string[] = [];

  if (surface.extension) {
    const wxtTypes = join(cwd, '.wxt', 'wxt.d.ts');
    if (existsSync(wxtTypes)) {
      lines.push('✓ Extension — WXT types already generated.');
    } else {
      const ok = runCommand(log, 'preparing extension types', cwd, 'pnpm', [
        'exec',
        'wxt',
        'prepare',
      ]);
      lines.push(
        ok
          ? '✓ Extension — generated WXT types (`.wxt/wxt.d.ts`).'
          : '✗ Extension — run `pnpm exec wxt prepare` after install.',
      );
    }
  }

  if (surface.mobile && platform === 'darwin') {
    const podfile = join(cwd, 'ios', 'Podfile');
    if (existsSync(podfile)) {
      const ok = runCommand(log, 'installing iOS pods', join(cwd, 'ios'), 'pod', ['install']);
      lines.push(
        ok
          ? '✓ Mobile — CocoaPods dependencies installed.'
          : '✗ Mobile — run `cd ios && pod install` after `expo prebuild`.',
      );
    } else {
      lines.push(
        '→ Mobile — no `ios/` folder yet. Run `pnpm ios` (Simulator) or `npx expo prebuild --platform ios` before store builds.',
      );
    }
  }

  if (surface.template === 'spa') {
    lines.push('✓ SPA — Vite dev server runs from npm scripts; no extra OS tools needed.');
  }

  return { lines };
}
