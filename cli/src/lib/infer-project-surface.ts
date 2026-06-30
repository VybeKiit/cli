import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TemplateName } from './scaffold';

/**
 * Injectable layout probe — keeps inference pure and testable without temp dirs on disk.
 */
export interface ProjectSurfaceProbe {
  readonly exists: (relativePath: string) => boolean;
  readonly readUtf8: (relativePath: string) => string | null;
}

/** Inferred buyer project surface — one rule set for doctor, commands, and platform skills. */
export interface ProjectSurface {
  readonly template: TemplateName;
  /** True when mobile build/publish tools (`eas`, `launch`) belong in the toolchain. */
  readonly mobile: boolean;
  /** True when Report Mode should write extension env keys. */
  readonly extension: boolean;
}

function createDefaultProbe(cwd: string): ProjectSurfaceProbe {
  return {
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
  };
}

function readPackageJson(
  probe: ProjectSurfaceProbe,
): { dependencies?: Record<string, string>; main?: string } | null {
  const raw = probe.readUtf8('package.json');
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as { dependencies?: Record<string, string>; main?: string };
  } catch {
    return null;
  }
}

function hasExpoConfig(probe: ProjectSurfaceProbe): boolean {
  for (const file of ['app.json', 'app.config.json'] as const) {
    const raw = probe.readUtf8(file);
    if (!raw) {
      continue;
    }
    try {
      const config: unknown = JSON.parse(raw);
      if (typeof config === 'object' && config !== null && 'expo' in config) {
        return true;
      }
    } catch {
      // unreadable config — try next file
    }
  }
  return false;
}

function inferTemplateFromPackage(pkg: {
  dependencies?: Record<string, string>;
  main?: string;
}): TemplateName | null {
  if (pkg.dependencies?.express) {
    return 'backend';
  }
  if (pkg.dependencies?.expo || pkg.main?.includes('expo-router')) {
    return 'mobile';
  }
  if (pkg.dependencies?.vite && pkg.dependencies?.['@tanstack/react-router']) {
    return 'spa';
  }
  if (pkg.dependencies?.next) {
    return 'web';
  }
  return null;
}

function inferTemplateFromLayout(probe: ProjectSurfaceProbe): TemplateName {
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
}

/**
 * Infer template + surface flags from cwd layout (sync — doctor and platform-skills).
 *
 * Ordered rules:
 * 1. package.json dependency signals (express → backend, expo → mobile, …)
 * 2. expo key in app.json / app.config.json
 * 3. wxt.config.ts / extension.config.ts / publish-extension skill marker
 * 4. Express backend layout (src/index.ts + src/app.ts)
 * 5. default web
 */
export function inferProjectSurfaceSync(
  cwd: string,
  probe: ProjectSurfaceProbe = createDefaultProbe(cwd),
): ProjectSurface {
  const pkg = readPackageJson(probe);
  const fromPackage = pkg ? inferTemplateFromPackage(pkg) : null;
  const template = fromPackage ?? inferTemplateFromLayout(probe);
  const mobile = template === 'mobile' || hasExpoConfig(probe);
  const extension = template === 'extension';
  return { template, mobile, extension };
}

/** Report Mode env keys for the inferred surface. */
export function reportModeEnvKeysForSurface(
  surface: ProjectSurface,
  assistant: string,
): Record<string, string> {
  if (surface.mobile) {
    return { EXPO_PUBLIC_VYBE_ASSISTANT: assistant };
  }
  if (surface.extension) {
    return { WXT_PUBLIC_VYBE_ASSISTANT: assistant };
  }
  return { VYBE_ASSISTANT: assistant };
}
