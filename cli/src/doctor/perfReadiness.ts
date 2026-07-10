import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ProjectSurface } from '../lib/inferProjectSurface';
import { inferProjectSurfaceSync } from '../lib/inferProjectSurface';
import type { TemplateName } from '../lib/scaffold';
import { type AssetsValidateDeps, isKitProject } from './assetsValidate';

/** Report for measured performance path discoverability (ADR-0038 §8.2). */
export type PerfReadinessReport = {
  /** True when not a kit project, or speed-check guidance was emitted (warn is non-fatal). */
  readonly ok: boolean;
  readonly lines: readonly string[];
  /** skipped = pre-create / non-kit; ok = skill or harness found; warn = missing speed checks. */
  readonly status: 'skipped' | 'ok' | 'warn';
};

/** Injectable filesystem probe (shared shape with assets validate). */
export type PerfReadinessDeps = AssetsValidateDeps;

/**
 * Create the default filesystem-backed probe for perf readiness.
 *
 * @param cwd - Project directory to inspect.
 * @returns Deps used by doctor in production.
 * @example
 * const deps = createDefaultPerfReadinessDeps(process.cwd());
 */
export const createDefaultPerfReadinessDeps = (cwd: string): PerfReadinessDeps => ({
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

/** Real skill entry paths only — never invent a skill name that is not shipped. */
const WEB_PERF_SKILL_PATHS = [
  '.agents/skills/web-perf-ci/SKILL.md',
  '.agents/skills/web-perf/SKILL.md',
] as const;

/** Maintainer / kit harness paths that actually exist in this monorepo. */
const PERF_HARNESS_PATHS = [
  '.github/perf/budgets.json',
  'lighthouserc.json',
  'lighthouserc.desktop.json',
  '.github/workflows/lighthouse-ci.yml',
  '.github/workflows/field-check.yml',
] as const;

const PERF_SCRIPT_MARKERS = ['perf:lab', 'perf:field', 'perf:psi', '@lhci/cli'] as const;

type PackageJsonScripts = {
  readonly scripts?: Partial<Record<string, string>>;
};

/**
 * Detect whether a web-perf skill file is present under project skills.
 *
 * @param deps - Injectable filesystem probe.
 * @returns True when a known web-perf skill SKILL.md exists.
 * @example
 * const present = hasWebPerfSkill(createDefaultPerfReadinessDeps(process.cwd()));
 */
export const hasWebPerfSkill = (deps: PerfReadinessDeps): boolean =>
  WEB_PERF_SKILL_PATHS.some((relativePath) => deps.exists(relativePath));

/**
 * Detect whether lab/field harness files from the monorepo are present.
 *
 * @param deps - Injectable filesystem probe.
 * @returns True when budgets, Lighthouse config, or perf workflows exist.
 * @example
 * const present = hasPerfHarnessFiles(createDefaultPerfReadinessDeps(process.cwd()));
 */
export const hasPerfHarnessFiles = (deps: PerfReadinessDeps): boolean =>
  PERF_HARNESS_PATHS.some((relativePath) => deps.exists(relativePath));

/**
 * Detect package.json scripts that run lab or field speed checks.
 *
 * @param deps - Injectable filesystem probe.
 * @returns True when perf:lab / perf:field / similar scripts are declared.
 * @example
 * const present = hasPerfScripts(createDefaultPerfReadinessDeps(process.cwd()));
 */
export const hasPerfScripts = (deps: PerfReadinessDeps): boolean => {
  const raw = deps.readUtf8('package.json');
  if (raw === null || raw === '') {
    return false;
  }
  try {
    const pkg = JSON.parse(raw) as PackageJsonScripts;
    const { scripts } = pkg;
    if (scripts === undefined) {
      return false;
    }
    const values = Object.values(scripts);
    const keys = Object.keys(scripts);
    return (
      keys.some((key) => PERF_SCRIPT_MARKERS.some((marker) => key.includes(marker))) ||
      values.some(
        (value) =>
          value !== undefined &&
          value !== '' &&
          PERF_SCRIPT_MARKERS.some((marker) => value.includes(marker)),
      )
    );
  } catch {
    return false;
  }
};

/**
 * Surface-aware success line when speed checks are discoverable.
 *
 * @param template - Inferred project template.
 * @param hasSkill - Whether web-perf skill is on disk.
 * @param hasHarness - Whether budgets/workflows/scripts are present.
 * @returns Buyer-readable success line.
 * @example
 * const line = okLineForSurface('web', true, false);
 */
const okLineForSurface = (
  template: TemplateName,
  hasSkill: boolean,
  hasHarness: boolean,
): string => {
  if (template === 'mobile') {
    if (hasSkill) {
      return '✓ speed checks - skill is discoverable; use it for JS bundle size, startup, and list jank (not static Lighthouse-only).';
    }
    return '✓ speed checks - harness present; focus on JS bundle size, startup time, and list jank for mobile.';
  }
  if (template === 'extension') {
    if (hasSkill) {
      return '✓ speed checks - skill is discoverable; use it for extension package size and popup/sidepanel snappiness.';
    }
    return '✓ speed checks - harness present; watch extension package size and popup/sidepanel snappiness.';
  }
  if (template === 'backend') {
    return '✓ speed checks - optional for API-only apps; keep response times and payload size in mind at go-live.';
  }
  // web + spa
  if (hasSkill && hasHarness) {
    return '✓ speed checks - web-perf skill and Lighthouse/CrUX harness are discoverable for this project.';
  }
  if (hasSkill) {
    return '✓ speed checks - web-perf skill is discoverable (lab Lighthouse + field CrUX path).';
  }
  return '✓ speed checks - Lighthouse/CrUX budgets or workflows are present for this project.';
};

/**
 * Surface-aware next action when speed checks are not discoverable.
 *
 * @param template - Inferred project template.
 * @returns One plain next action for the agent.
 * @example
 * const line = warnLineForSurface('extension');
 */
const warnLineForSurface = (template: TemplateName): string => {
  if (template === 'mobile') {
    return '→ speed checks - not set up yet. Ask your agent to add speed checks for JS bundle size and app startup.';
  }
  if (template === 'extension') {
    return '→ speed checks - not set up yet. Ask your agent to add speed checks for package size and popup snappiness.';
  }
  if (template === 'backend') {
    return '→ speed checks - optional for API-only apps; skip unless you care about measured latency budgets.';
  }
  return '→ speed checks - not set up yet. Ask your agent to add speed checks (Lighthouse lab + field CrUX when live).';
};

/**
 * Report whether web-perf-ci (or real harness wrappers) are discoverable for the surface.
 * Pre-create / non-kit directories skip silently. Does not run Lighthouse.
 *
 * @param cwd - Project directory to inspect.
 * @param surface - Optional precomputed surface; inferred when omitted.
 * @param deps - Optional injectable filesystem probe.
 * @returns Perf readiness report with surface-aware lines.
 * @example
 * const report = verifyPerfReadiness(process.cwd());
 */
export const verifyPerfReadiness = (
  cwd: string,
  surface: ProjectSurface = inferProjectSurfaceSync(cwd),
  deps: PerfReadinessDeps = createDefaultPerfReadinessDeps(cwd),
): PerfReadinessReport => {
  if (!isKitProject(deps)) {
    return { ok: true, lines: [], status: 'skipped' };
  }

  const skill = hasWebPerfSkill(deps);
  const harness = hasPerfHarnessFiles(deps) || hasPerfScripts(deps);
  const ready = skill || harness;

  // Backend is always advisory; presence is a bonus, absence is a soft note.
  if (surface.template === 'backend') {
    if (ready) {
      return {
        ok: true,
        lines: [okLineForSurface('backend', skill, harness)],
        status: 'ok',
      };
    }
    return {
      ok: true,
      lines: [warnLineForSurface('backend')],
      status: 'warn',
    };
  }

  if (ready) {
    return {
      ok: true,
      lines: [okLineForSurface(surface.template, skill, harness)],
      status: 'ok',
    };
  }

  return {
    ok: true,
    lines: [warnLineForSurface(surface.template)],
    status: 'warn',
  };
};
