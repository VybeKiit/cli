/**
 * OS-native tools the buyer's template needs beyond npm-global CLIs — CocoaPods for iOS,
 * Watchman for fast Metro reloads, Docker for backend containers. Pure planner half of
 * doctor (see `toolchain.ts`); spawning lives in `run.ts`.
 */

import type { ProjectSurface } from '../lib/inferProjectSurface';
import type { Platform, Tool } from './toolchain';

/** Keeps Metro file watching fast while editing a mobile app. */
const WATCHMAN: Tool = {
  name: 'watchman',
  purpose: 'keep your mobile app preview fast while you edit',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'watchman'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'watchman'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'watchman'], requires: 'Homebrew' },
  },
};

/** Installs iOS native libraries after Expo generates the `ios/` folder (macOS only). */
const COCOAPODS: Tool = {
  name: 'pod',
  purpose: 'install iOS native libraries for your mobile app',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'cocoapods'], requires: 'Homebrew' },
    win32: {
      command: 'echo',
      args: ['CocoaPods is only needed on macOS for iOS builds'],
    },
    linux: {
      command: 'echo',
      args: ['CocoaPods is only needed on macOS for iOS builds'],
    },
  },
};

/** Runs local services (database, API) in containers for backend projects. */
const DOCKER: Tool = {
  name: 'docker',
  purpose: 'run local services in containers',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', '--cask', 'docker'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'docker'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'docker'], requires: 'Homebrew' },
  },
  auth: {
    command: 'docker',
    args: ['info'],
    loginHint: 'Start Docker Desktop (or the Docker daemon), then re-run doctor.',
  },
};

/**
 * Pick native OS tools for the inferred template surface. SPA and extension templates rely
 * on npm deps only (`vite`, `wxt prepare`); mobile adds Watchman everywhere CocoaPods
 * applies on macOS; backend adds Docker.
 */
export function selectNativeTools(surface: ProjectSurface, platform: Platform): Tool[] {
  const tools: Tool[] = [];
  const add = (tool: Tool): void => {
    if (!tools.some((t) => t.name === tool.name)) {
      tools.push(tool);
    }
  };

  if (surface.template === 'backend') {
    add(DOCKER);
  }

  if (surface.mobile) {
    add(WATCHMAN);
    if (platform === 'darwin') {
      add(COCOAPODS);
    }
  }

  return tools;
}

/** Merge cloud + native tools without duplicate names. */
export function mergeDoctorTools(
  providerTools: readonly Tool[],
  nativeTools: readonly Tool[],
): Tool[] {
  const merged: Tool[] = [];
  const add = (tool: Tool): void => {
    if (!merged.some((t) => t.name === tool.name)) {
      merged.push(tool);
    }
  };
  for (const tool of providerTools) {
    add(tool);
  }
  for (const tool of nativeTools) {
    add(tool);
  }
  return merged;
}
