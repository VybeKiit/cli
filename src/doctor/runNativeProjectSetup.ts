import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectSurface } from '../lib/inferProjectSurface';
import type { Platform } from './toolchain';

export type NativeProjectSetupResult = {
  readonly lines: readonly string[];
};

type NativeCommandOptions = {
  readonly log: Console;
  readonly label: string;
  readonly cwd: string;
  readonly command: string;
  readonly args: readonly string[];
};

/**
 * Run one native setup command.
 *
 * @param options - Command label, cwd, executable, args, and logger.
 * @returns True when the command exits successfully.
 * @example
 * const ok = runCommand({ log: console, label: 'pods', cwd, command: 'pod', args: ['install'] });
 */
const runCommand = (options: NativeCommandOptions): boolean => {
  const { args, command, cwd, label, log } = options;
  log.log(`[doctor] ${label}: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, [...args], { cwd, stdio: 'inherit' });
  return result.status === 0;
};

/**
 * Render and run extension-specific setup steps.
 *
 * @param cwd - Project directory.
 * @param log - Logger used for setup commands.
 * @returns Buyer-readable setup lines.
 * @example
 * const lines = runExtensionSetup(process.cwd(), console);
 */
const runExtensionSetup = (cwd: string, log: Console): string[] => {
  const wxtTypes = join(cwd, '.wxt', 'wxt.d.ts');
  if (existsSync(wxtTypes)) {
    return ['✓ Extension - WXT types already generated.'];
  }

  const ok = runCommand({
    log,
    label: 'preparing extension types',
    cwd,
    command: 'pnpm',
    args: ['exec', 'wxt', 'prepare'],
  });
  return [
    ok
      ? '✓ Extension - generated WXT types (`.wxt/wxt.d.ts`).'
      : '✗ Extension - run `pnpm exec wxt prepare` after install.',
  ];
};

/**
 * Render and run iOS setup steps on macOS.
 *
 * @param cwd - Project directory.
 * @param platform - Current OS family.
 * @param log - Logger used for setup commands.
 * @returns Buyer-readable setup lines.
 * @example
 * const lines = runMobileSetup(process.cwd(), 'darwin', console);
 */
const runMobileSetup = (cwd: string, platform: Platform, log: Console): string[] => {
  if (platform !== 'darwin') {
    return [];
  }

  const podfile = join(cwd, 'ios', 'Podfile');
  if (!existsSync(podfile)) {
    return [
      '→ Mobile - no `ios/` folder yet. Run `pnpm ios` (Simulator) or `npx expo prebuild --platform ios` before store builds.',
    ];
  }

  const ok = runCommand({
    log,
    label: 'installing iOS pods',
    cwd: join(cwd, 'ios'),
    command: 'pod',
    args: ['install'],
  });
  return [
    ok
      ? '✓ Mobile - CocoaPods dependencies installed.'
      : '✗ Mobile - run `cd ios && pod install` after `expo prebuild`.',
  ];
};

/**
 * One-time project steps after native CLIs are present — `pod install`, `wxt prepare`, etc.
 * Idempotent: skips when folders or generated output already exist.
 *
 * @param cwd - Project directory to prepare.
 * @param surface - Inferred project surface.
 * @param platform - Current OS family.
 * @param log - Logger used for setup output.
 * @returns Native project setup result lines.
 * @example
 * const result = runNativeProjectSetup(process.cwd(), surface, 'darwin', console);
 */
export const runNativeProjectSetup = (
  cwd: string,
  surface: ProjectSurface,
  platform: Platform,
  log: Console = console,
): NativeProjectSetupResult => {
  const lines: string[] = [];

  if (surface.extension) {
    lines.push(...runExtensionSetup(cwd, log));
  }

  if (surface.mobile) {
    lines.push(...runMobileSetup(cwd, platform, log));
  }

  if (surface.template === 'spa') {
    lines.push('✓ SPA - Vite dev server runs from npm scripts; no extra OS tools needed.');
  }

  return { lines };
};
