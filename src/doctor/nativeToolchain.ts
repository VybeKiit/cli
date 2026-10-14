/**
 * OS-native tools the buyer's template needs beyond npm-global CLIs — CocoaPods for iOS,
 * Watchman for fast Metro reloads, Docker for backend containers. Pure planner half of
 * doctor (see `toolchain.ts`); spawning lives in `run.ts`.
 */

import type { ProjectSurface } from '../lib/inferProjectSurface';
import { aptInstall, homebrewInstall, wingetInstall } from './installSteps';
import type { Platform, Tool } from './toolchain';

/** Keeps Metro file watching fast while editing a mobile app. */
const WATCHMAN: Tool = {
  name: 'watchman',
  purpose: 'keep your mobile app preview fast while you edit',
  versionArgs: ['--version'],
  install: {
    darwin: homebrewInstall('watchman'),
    linux: aptInstall('watchman'),
  },
};

/** Installs iOS native libraries after Expo generates the `ios/` folder (macOS only). */
const COCOAPODS: Tool = {
  name: 'pod',
  purpose: 'install iOS native libraries for your mobile app',
  versionArgs: ['--version'],
  install: {
    darwin: homebrewInstall('cocoapods'),
  },
};

/** Runs local services (database, API) in containers for backend projects. */
const DOCKER: Tool = {
  name: 'docker',
  purpose: 'run local services in containers',
  versionArgs: ['--version'],
  install: {
    darwin: homebrewInstall('--cask', 'docker'),
    win32: wingetInstall('Docker.DockerDesktop'),
    linux: { kind: 'script', url: 'https://get.docker.com' },
  },
  auth: {
    command: 'docker',
    args: ['info'],
    loginHint: 'Start Docker Desktop (or the Docker daemon), then re-run doctor.',
  },
};

/**
 * Pick native OS tools for the inferred template surface.
 *
 * @param surface - Inferred project surface from the buyer's template.
 * @param platform - Current OS family used to select native install steps.
 * @returns Ordered native tools needed by the project surface.
 * @example
 * const tools = selectNativeTools(surface, 'darwin');
 */
export const selectNativeTools = (surface: ProjectSurface, platform: Platform): Tool[] => {
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
    add(COCOAPODS);
  }

  return tools.filter((tool) => tool.install[platform] !== undefined);
};

/**
 * Merge provider and native doctor tools without duplicate names.
 *
 * @param providerTools - Tools selected from active providers.
 * @param nativeTools - Tools selected from native project requirements.
 * @returns Ordered tools with first-seen names preserved.
 * @example
 * const tools = mergeDoctorTools(providerTools, nativeTools);
 */
export const mergeDoctorTools = (
  providerTools: readonly Tool[],
  nativeTools: readonly Tool[],
): Tool[] => {
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
};
