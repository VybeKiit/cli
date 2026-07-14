import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TemplateName } from './scaffold';

/** Injectable layout probe that keeps inference pure and testable. */
export type ProjectSurfaceProbe = {
  readonly exists: (relativePath: string) => boolean;
  readonly readUtf8: (relativePath: string) => string | null;
};

/** Inferred buyer project surface — one rule set for doctor, commands, and platform skills. */
export type ProjectSurface = {
  readonly template: TemplateName;
  /** True when mobile build/publish tools (`eas`, `launch`) belong in the toolchain. */
  readonly mobile: boolean;
  /** True when Report Mode should write extension env keys. */
  readonly extension: boolean;
};

/**
 * Create the default filesystem-backed project surface probe.
 *
 * @param cwd - Project directory to inspect.
 * @returns Probe that reads paths relative to the project directory.
 * @example
 * const probe = createDefaultProbe(process.cwd());
 */
const createDefaultProbe = (cwd: string): ProjectSurfaceProbe => ({
  exists: (relativePath) => existsSync(join(cwd, relativePath)),
  readUtf8: (relativePath) => {
    const absolute = join(cwd, relativePath);
    if (!existsSync(absolute)) {
      return null;
    }
    try {
      return readFileSync(absolute, 'utf8');
    } catch {
      return null;
    }
  },
});

/**
 * Read and parse package.json through the injected probe.
 *
 * @param probe - Project surface probe used for file access.
 * @returns Parsed package fields used for template inference, or null.
 * @example
 * const pkg = readPackageJson(createDefaultProbe(process.cwd()));
 */
const readPackageJson = (
  probe: ProjectSurfaceProbe,
): { readonly dependencies?: Partial<Record<string, string>>; readonly main?: string } | null => {
  const raw = probe.readUtf8('package.json');
  if (raw === null || raw === '') {
    return null;
  }
  try {
    return JSON.parse(raw) as {
      readonly dependencies?: Partial<Record<string, string>>;
      readonly main?: string;
    };
  } catch {
    return null;
  }
};

/**
 * Check whether the project has an Expo config file.
 *
 * @param probe - Project surface probe used for file access.
 * @returns True when `app.json` or `app.config.json` contains an `expo` key.
 * @example
 * const mobile = hasExpoConfig(createDefaultProbe(process.cwd()));
 */
const hasExpoConfig = (probe: ProjectSurfaceProbe): boolean => {
  for (const file of ['app.json', 'app.config.json'] as const) {
    const raw = probe.readUtf8(file);
    if (raw !== null && raw !== '') {
      try {
        const config: unknown = JSON.parse(raw);
        if (typeof config === 'object' && config !== null && 'expo' in config) {
          return true;
        }
      } catch {
        // unreadable config, try next file
      }
    }
  }
  return false;
};

/**
 * Infer a template from package dependency signals.
 *
 * @param pkg - Parsed package fields used for inference.
 * @returns Template name when dependency signals are recognized, otherwise null.
 * @example
 * const template = inferTemplateFromPackage({ dependencies: { next: 'latest' } });
 */
const inferTemplateFromPackage = (pkg: {
  readonly dependencies?: Partial<Record<string, string>>;
  readonly main?: string;
}): TemplateName | null => {
  const { dependencies, main } = pkg;

  if (dependencies !== undefined && dependencies.express !== undefined) {
    return 'backend';
  }
  if (
    (dependencies !== undefined && dependencies.expo !== undefined) ||
    main?.includes('expo-router')
  ) {
    return 'mobile';
  }
  if (
    dependencies !== undefined &&
    dependencies.vite !== undefined &&
    dependencies['@tanstack/react-router'] !== undefined
  ) {
    return 'spa';
  }
  if (dependencies !== undefined && dependencies.next !== undefined) {
    return 'web';
  }
  return null;
};

/**
 * Infer a template from project files when package signals are absent.
 *
 * @param probe - Project surface probe used for file access.
 * @returns Best-effort template name from the project layout.
 * @example
 * const template = inferTemplateFromLayout(createDefaultProbe(process.cwd()));
 */
const inferTemplateFromLayout = (probe: ProjectSurfaceProbe): TemplateName => {
  if (hasExpoConfig(probe)) {
    return 'mobile';
  }
  if (probe.exists('wxt.config.ts') || probe.exists('extension.config.ts')) {
    return 'extension';
  }
  if (probe.exists('.vybekiit/skills/publish-extension.md')) {
    return 'extension';
  }
  if (probe.exists('src/index.ts') && probe.exists('src/app.ts')) {
    return 'backend';
  }
  return 'web';
};

/**
 * Infer template + surface flags from cwd layout (sync — doctor and platform-skills).
 *
 * Ordered rules:
 * 1. package.json dependency signals (express → backend, expo → mobile, …)
 * 2. expo key in app.json / app.config.json
 * 3. wxt.config.ts / extension.config.ts / publish-extension skill marker
 * 4. Express backend layout (src/index.ts + src/app.ts)
 * 5. default web
 *
 * @param cwd - Project directory to inspect.
 * @param probe - Optional injectable probe for tests.
 * @returns Inferred template plus platform surface flags.
 * @example
 * const surface = inferProjectSurfaceSync(process.cwd());
 */
export const inferProjectSurfaceSync = (
  cwd: string,
  probe: ProjectSurfaceProbe = createDefaultProbe(cwd),
): ProjectSurface => {
  const pkg = readPackageJson(probe);
  const fromPackage = pkg ? inferTemplateFromPackage(pkg) : null;
  const template = fromPackage === null ? inferTemplateFromLayout(probe) : fromPackage;
  const mobile = template === 'mobile' || hasExpoConfig(probe);
  const extension = template === 'extension';
  return { template, mobile, extension };
};

/**
 * Resolve Report Mode env keys for an inferred project surface.
 *
 * @param surface - Inferred project surface.
 * @param assistant - Assistant id to write into the env key.
 * @returns Env key/value map for the project surface.
 * @example
 * const env = reportModeEnvKeysForSurface(surface, 'claude-code');
 */
export const reportModeEnvKeysForSurface = (
  surface: ProjectSurface,
  assistant: string,
): Record<string, string> => {
  if (surface.mobile) {
    return { EXPO_PUBLIC_VYBE_ASSISTANT: assistant };
  }
  if (surface.extension) {
    return { WXT_PUBLIC_VYBE_ASSISTANT: assistant };
  }
  return { VYBE_ASSISTANT: assistant };
};
