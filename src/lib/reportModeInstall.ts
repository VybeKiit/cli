import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { writeEnvKeys } from '../doctor/writeEnvKeys';
import type { AppSurfaceLayout } from './appSurface';
import { reportModeEnvKeysForSurface } from './inferProjectSurface';
import { ensureDependencies } from './packageJsonDeps';
import type { TemplateName } from './scaffold';

/**
 * `vybekiit add report-mode` — install the dev-only Report Mode overlay into an existing
 * buyer app (ADR-0046). The first sanctioned owned-`src/` backfill: `add` copies OWNED
 * template files post-scaffold, which `update-kit` deliberately refuses (ADR-0007).
 *
 * The plan/apply split and skip-if-exists per-file copy mirror `pageRecipeInstall.ts`;
 * every read is behind an injectable {@link ReportModeFs} seam so planning is unit-testable
 * without touching disk.
 */

/** Template surfaces that ship owned Report Mode source (`spa`/`backend` do not). */
export type ReportModeSurface = 'web' | 'mobile' | 'extension';

const INSTALLABLE_SURFACES: readonly ReportModeSurface[] = ['web', 'mobile', 'extension'];

/**
 * Narrow a template name to an installable Report Mode surface.
 *
 * @param surface - Inferred template name.
 * @returns True when the surface ships owned Report Mode source.
 */
const isInstallableSurface = (surface: TemplateName): surface is ReportModeSurface =>
  (INSTALLABLE_SURFACES as readonly string[]).includes(surface);

/** Injectable filesystem seam so the planner runs against an in-memory tree in tests. */
export type ReportModeFs = {
  /** Recursively list file paths (posix-relative to `dir`); empty when `dir` is absent. */
  readonly listFiles: (dir: string) => Promise<readonly string[]>;
  /** Read a file's text, or `null` when it does not exist. */
  readonly readText: (path: string) => Promise<string | null>;
  /** True when a path exists on disk. */
  readonly exists: (path: string) => Promise<boolean>;
  /** Write text, creating parent directories as needed. */
  readonly writeText: (path: string, content: string) => Promise<void>;
};

/**
 * Recursively collect posix-relative file paths under a directory.
 *
 * @param dir - Directory to walk.
 * @param prefix - Accumulated relative prefix for nested calls.
 * @returns Relative file paths (empty when the directory is missing).
 */
const listFilesRecursive = async (dir: string, prefix = ''): Promise<string[]> => {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
        if (entry.isDirectory()) {
          return await listFilesRecursive(join(dir, entry.name), rel);
        }
        return [rel];
      }),
    );
    return nested.flat();
  } catch {
    return [];
  }
};

/** Default disk-backed seam used by the CLI (tests inject an in-memory implementation). */
export const defaultReportModeFs: ReportModeFs = {
  listFiles: (dir) => listFilesRecursive(dir),
  readText: async (path) => {
    try {
      return await readFile(path, 'utf8');
    } catch {
      return null;
    }
  },
  exists: async (path) => {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  },
  writeText: async (path, content) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf8');
  },
};

/** Owned source subtrees + companion files the planner copies for one surface. */
type SurfaceSources = {
  /** Directories copied whole (posix-relative to `templates/<surface>`), skip-if-exists. */
  readonly subtrees: readonly string[];
  /** Individual owned files copied only when the destination lacks them. */
  readonly companions: readonly string[];
  /**
   * Owned imports Report Mode relies on that ship in every scaffolded app but are NOT
   * copied here (foundational files with their own dependency webs). Surfaced as a TODO.
   */
  readonly assumedPresent: readonly string[];
};

/**
 * Per-surface copy closure, verified by grepping every non-relative import in each subtree.
 * `web` additionally pulls the `walkthrough` subtree (report-mode-tutorial's sole consumer).
 */
const SURFACE_SOURCES: Record<ReportModeSurface, SurfaceSources> = {
  web: {
    subtrees: ['src/components/report-mode', 'src/lib/report-mode', 'src/components/walkthrough'],
    companions: ['src/lib/nodeEnv.ts', 'src/lib/utils.ts'],
    assumedPresent: [],
  },
  mobile: {
    subtrees: ['src/components/report-mode', 'src/lib/report-mode'],
    companions: ['src/lib/nodeEnv.ts'],
    assumedPresent: ['@/theme/useTheme'],
  },
  extension: {
    subtrees: ['src/components/report-mode', 'src/lib/report-mode'],
    companions: ['src/lib/utils.ts', 'styles/report-mode-note.css'],
    assumedPresent: ['@/components/ui/button', '@/components/ui/input'],
  },
};

/** The one web file whose `@/i18n/navigation` import is rewritten for non-next-intl apps. */
const REWRITE_TARGET = 'src/components/report-mode/report-mode-dev.tsx';
/** The copy-if-missing helper whose (only) dependency is `cnfast` — injected when written. */
const UTILS_FILE = 'src/lib/utils.ts';
const WORKSPACE_RANGE = 'workspace:*';

/** One planned file copy with its resolved destination and pre-existing state. */
export type PlannedFile = {
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly content: string;
  /** True when the destination file already exists (skip target unless `--force`). */
  readonly exists: boolean;
};

/** Outcome of the web-only `@/i18n/navigation` → `next/navigation` rewrite decision. */
export type ReportModeRewrite = {
  readonly applied: boolean;
  readonly reason: string;
};

/** Result of detecting/planning the root-layout mount edit. */
export type MountPlan = {
  readonly status: 'inserted' | 'todo' | 'already';
  readonly path: string;
  readonly importSnippet: string;
  readonly jsxSnippet: string;
  readonly reason: string;
  /** Rewritten layout content to write when `status` is `inserted`. */
  readonly newContent?: string;
};

/** A ready-to-apply Report Mode install for one surface. */
export type InstallableReportModePlan = {
  readonly available: true;
  readonly surface: ReportModeSurface;
  readonly dest: string;
  readonly files: readonly PlannedFile[];
  readonly deps: Record<string, string>;
  readonly env: Record<string, string>;
  readonly rewrite: ReportModeRewrite;
  readonly mount: MountPlan;
  readonly assumedPresent: readonly string[];
  readonly todos: readonly string[];
  readonly nextCommands: readonly string[];
};

/** Planner result — either an installable plan or a clean "not available" answer. */
export type ReportModeInstallPlan =
  | InstallableReportModePlan
  | { readonly available: false; readonly surface: TemplateName };

/**
 * Read a `package.json` string into its `dependencies` map (empty when absent/invalid).
 *
 * @param raw - File text, or `null` when the file is missing.
 * @returns Dependency name → version map.
 */
const parseDependencies = (raw: string | null): Partial<Record<string, string>> => {
  if (raw === null || raw === '') {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as { readonly dependencies?: Record<string, string> };
    return parsed.dependencies ?? {};
  } catch {
    return {};
  }
};

/**
 * Apply the deterministic non-next-intl import rewrite to the target file only.
 *
 * @param relativePath - Planned file's posix-relative path.
 * @param raw - Source content.
 * @param applyRewrite - Whether the rewrite is active for this surface.
 * @returns Content with `@/i18n/navigation` swapped for `next/navigation` when applicable.
 */
const rewriteContent = (relativePath: string, raw: string, applyRewrite: boolean): string => {
  if (!applyRewrite || relativePath !== REWRITE_TARGET) {
    return raw;
  }
  return raw.replaceAll("from '@/i18n/navigation'", "from 'next/navigation'");
};

/** Inputs for one planned-file build. */
type PlanFileOptions = {
  readonly fs: ReportModeFs;
  readonly sourceDir: string;
  readonly dest: string;
  readonly relativePath: string;
  readonly applyRewrite: boolean;
};

/**
 * Build one planned file, or `null` when the source file is absent.
 *
 * @param options - Seam, source root, destination, relative path, and rewrite flag.
 * @returns Planned file with its destination-existence flag, or `null`.
 */
const planReportModeFile = async (options: PlanFileOptions): Promise<PlannedFile | null> => {
  const { fs, sourceDir, dest, relativePath, applyRewrite } = options;
  const sourceText = await fs.readText(join(sourceDir, relativePath));
  if (sourceText === null) {
    return null;
  }
  const absolutePath = join(dest, relativePath);
  return {
    relativePath,
    absolutePath,
    content: rewriteContent(relativePath, sourceText, applyRewrite),
    exists: await fs.exists(absolutePath),
  };
};

/**
 * Enumerate every source file (subtree-expanded + companions) into planned copies.
 *
 * @param options - Seam, source root, destination, surface closure, and rewrite flag.
 * @returns Planned files in a stable order (subtrees first, then companions).
 */
const planReportModeFiles = async (options: {
  readonly fs: ReportModeFs;
  readonly sourceDir: string;
  readonly dest: string;
  readonly sources: SurfaceSources;
  readonly applyRewrite: boolean;
}): Promise<readonly PlannedFile[]> => {
  const { fs, sourceDir, dest, sources, applyRewrite } = options;
  const subtreeGroups = await Promise.all(
    sources.subtrees.map(async (subtree) => {
      const names = await fs.listFiles(join(sourceDir, subtree));
      return names.map((name) => `${subtree}/${name}`);
    }),
  );
  const relativePaths = [...subtreeGroups.flat(), ...sources.companions];
  const planned = await Promise.all(
    relativePaths.map((relativePath) =>
      planReportModeFile({ fs, sourceDir, dest, relativePath, applyRewrite }),
    ),
  );
  return planned.filter((file): file is PlannedFile => file !== null);
};

/**
 * Compute the dependency set to ensure for a surface.
 *
 * `@vybekiit/*` stay `workspace:*` (ADR-0033: buyers resolve locally). `sonner` (web) and
 * `cnfast` (only when the copy-if-missing `utils.ts` is actually written) reuse the version
 * the source template pins rather than guessing.
 *
 * @param surface - Installable surface.
 * @param sourceDeps - Dependencies from the source template's `package.json`.
 * @param willWriteUtils - Whether `src/lib/utils.ts` will be newly written.
 * @returns Dependency name → version map.
 */
const reportModeDependencies = (
  surface: ReportModeSurface,
  sourceDeps: Partial<Record<string, string>>,
  willWriteUtils: boolean,
): Record<string, string> => {
  const dependencies: Record<string, string> = { '@vybekiit/report-mode': WORKSPACE_RANGE };
  if (surface === 'web') {
    dependencies['@vybekiit/ui'] = WORKSPACE_RANGE;
    dependencies['@vybekiit/walkthrough'] = WORKSPACE_RANGE;
    const { sonner } = sourceDeps;
    if (sonner !== undefined) {
      dependencies.sonner = sonner;
    }
  }
  if (willWriteUtils && (surface === 'web' || surface === 'extension')) {
    const { cnfast } = sourceDeps;
    if (cnfast !== undefined) {
      dependencies.cnfast = cnfast;
    }
  }
  return dependencies;
};

/**
 * Compute the `.env` keys to write.
 *
 * `VYBE_REPORT_MODE=1` is the gate the doctor never writes; the assistant key reuses the
 * SSOT `reportModeEnvKeysForSurface`. When no assistant is resolved, only the gate is written.
 *
 * @param surface - Installable surface.
 * @param assistant - Resolved assistant id, or `null`.
 * @returns Env key → value map.
 */
const reportModeInstallEnv = (
  surface: ReportModeSurface,
  assistant: string | null,
): Record<string, string> => {
  const installEnv: Record<string, string> = { VYBE_REPORT_MODE: '1' };
  if (assistant === null) {
    return installEnv;
  }
  const projectSurface = {
    template: surface,
    mobile: surface === 'mobile',
    extension: surface === 'extension',
  };
  return { ...installEnv, ...reportModeEnvKeysForSurface(projectSurface, assistant) };
};

/**
 * Decide the web-only import rewrite. Trigger only when the buyer is NOT next-intl: none of
 * a locale route segment, a `src/i18n/navigation.ts`, or a `next-intl` dependency.
 *
 * @param options - Surface, destination, layout, and destination dependencies.
 * @returns Rewrite decision with a human reason.
 */
const planRewrite = async (options: {
  readonly surface: ReportModeSurface;
  readonly dest: string;
  readonly fs: ReportModeFs;
  readonly appSurface: AppSurfaceLayout | undefined;
  readonly destDeps: Partial<Record<string, string>>;
}): Promise<ReportModeRewrite> => {
  const { surface, dest, fs, appSurface, destDeps } = options;
  if (surface !== 'web') {
    return { applied: false, reason: `No i18n rewrite for the ${surface} surface.` };
  }
  const usesLocaleSegment = appSurface?.usesLocaleSegment === true;
  const hasI18nNavigation = await fs.exists(join(dest, 'src', 'i18n', 'navigation.ts'));
  const hasNextIntlDep = destDeps['next-intl'] !== undefined;
  if (usesLocaleSegment || hasI18nNavigation || hasNextIntlDep) {
    return { applied: false, reason: 'Project uses next-intl; kept @/i18n/navigation.' };
  }
  return { applied: true, reason: 'Non-next-intl project; rewrote to next/navigation.' };
};

/** The layout mount target + snippets for one surface. */
type MountSpec = {
  readonly component: string;
  readonly importStatement: string;
  readonly jsxTag: string;
  readonly candidatePaths: readonly string[];
  /** Insertion anchor for auto-mount, or `undefined` when only a TODO is emitted. */
  readonly anchor: string | undefined;
};

/**
 * De-duplicate a path list while preserving order.
 *
 * @param paths - Candidate paths.
 * @returns Ordered unique paths.
 */
const uniquePaths = (paths: readonly string[]): readonly string[] => [...new Set(paths)];

/**
 * Build the mount specification for a surface.
 *
 * @param surface - Installable surface.
 * @param dest - Destination app root.
 * @param appSurface - Resolved web layout (undefined for mobile/extension).
 * @returns Mount component, snippets, candidate layouts, and anchor.
 */
const reportModeMountSpec = (
  surface: ReportModeSurface,
  dest: string,
  appSurface: AppSurfaceLayout | undefined,
): MountSpec => {
  if (surface === 'web') {
    const appDir = appSurface?.appDir;
    const candidates: string[] = [];
    if (appDir !== undefined && appSurface?.usesLocaleSegment === true) {
      candidates.push(join(appDir, '[locale]', 'layout.tsx'));
    }
    if (appDir !== undefined) {
      candidates.push(join(appDir, 'layout.tsx'));
    }
    candidates.push(join(dest, 'src', 'app', 'layout.tsx'));
    return {
      component: 'ReportModeDevShell',
      importStatement:
        "import { ReportModeDevShell } from '@/components/report-mode/report-mode-shell';",
      jsxTag: '<ReportModeDevShell />',
      candidatePaths: uniquePaths(candidates),
      anchor: '</body>',
    };
  }
  if (surface === 'mobile') {
    return {
      component: 'ReportModeDev',
      importStatement: "import { ReportModeDev } from '@/components/report-mode/report-mode-dev';",
      jsxTag: '<ReportModeDev />',
      candidatePaths: [join(dest, 'app', '_layout.tsx')],
      anchor: undefined,
    };
  }
  return {
    component: 'ReportModeDev',
    importStatement: "import { ReportModeDev } from '@/components/report-mode/report-mode-dev';",
    jsxTag: '<ReportModeDev />',
    candidatePaths: [join(dest, 'src', 'components', 'app-root.tsx')],
    anchor: undefined,
  };
};

/**
 * Insert the mount import after the last top-level import and the JSX before the anchor.
 *
 * @param content - Original layout content (single-anchor, verified by caller).
 * @param importStatement - Import line to add.
 * @param jsxTag - JSX element to render.
 * @param anchor - Closing tag the element is inserted before.
 * @returns Rewritten layout content.
 */
const insertMount = (
  content: string,
  importStatement: string,
  jsxTag: string,
  anchor: string,
): string => {
  const lines = content.split('\n');
  const lastImportIndex = lines.reduce<number>(
    (acc, line, index) => (line.startsWith('import ') ? index : acc),
    -1,
  );
  const withImport =
    lastImportIndex >= 0
      ? [
          ...lines.slice(0, lastImportIndex + 1),
          importStatement,
          ...lines.slice(lastImportIndex + 1),
        ].join('\n')
      : `${importStatement}\n${content}`;
  return withImport.replace(anchor, `  ${jsxTag}\n      ${anchor}`);
};

/**
 * Detect existing state and plan the root-layout mount (auto-insert or TODO).
 *
 * Auto-inserts only when exactly one candidate layout exists and holds a single anchor;
 * otherwise returns a TODO with the exact snippets. Idempotent: an already-mounted layout
 * returns `already`.
 *
 * @param fs - Filesystem seam.
 * @param spec - Mount specification for the surface.
 * @returns Mount plan with status and (for `inserted`) the rewritten content.
 */
const planMount = async (fs: ReportModeFs, spec: MountSpec): Promise<MountPlan> => {
  const loaded = await Promise.all(
    spec.candidatePaths.map(async (candidate) => ({
      candidate,
      content: await fs.readText(candidate),
    })),
  );
  const existing = loaded.filter(
    (entry): entry is { candidate: string; content: string } => entry.content !== null,
  );
  const base = {
    path: existing[0]?.candidate ?? spec.candidatePaths[0] ?? '',
    importSnippet: spec.importStatement,
    jsxSnippet: spec.jsxTag,
  };

  if (existing.length === 0) {
    return { ...base, status: 'todo', reason: 'No root layout found; mount manually.' };
  }
  const alreadyMounted = existing.find((entry) => entry.content.includes(spec.component));
  if (alreadyMounted !== undefined) {
    return {
      ...base,
      path: alreadyMounted.candidate,
      status: 'already',
      reason: 'Report Mode is already mounted.',
    };
  }

  // Auto-insert only into the single layout that owns the anchor (Next.js apps ship a root
  // passthrough layout with no `</body>` plus a locale layout that has it); otherwise TODO.
  const anchor = spec.anchor;
  if (anchor !== undefined) {
    const mountable = existing.filter((entry) => entry.content.split(anchor).length - 1 === 1);
    const target = mountable[0];
    if (mountable.length === 1 && target !== undefined) {
      return {
        ...base,
        path: target.candidate,
        status: 'inserted',
        reason: 'Mounted into the root layout.',
        newContent: insertMount(target.content, spec.importStatement, spec.jsxTag, anchor),
      };
    }
  }
  return { ...base, status: 'todo', reason: 'Mount manually (no single layout anchor found).' };
};

/** Options for {@link planReportModeInstall}. */
export type PlanReportModeOptions = {
  readonly kitRoot: string;
  readonly dest: string;
  readonly surface: TemplateName;
  readonly assistant: string | null;
  /** Resolved web layout (from `selectedAppSurface`); undefined for other surfaces. */
  readonly appSurface?: AppSurfaceLayout;
  readonly fs?: ReportModeFs;
};

/**
 * Plan a Report Mode install for a destination app. Pure aside from the injected {@link
 * ReportModeFs} reads. Returns a clean not-available result for `spa`/`backend`.
 *
 * @param options - Kit root, destination, surface, assistant, and optional seams.
 * @returns An installable plan, or a not-available answer.
 * @example
 * const plan = await planReportModeInstall({ kitRoot, dest, surface: 'web', assistant: 'claude' });
 */
export const planReportModeInstall = async (
  options: PlanReportModeOptions,
): Promise<ReportModeInstallPlan> => {
  const { kitRoot, dest, surface, assistant, appSurface, fs = defaultReportModeFs } = options;
  if (!isInstallableSurface(surface)) {
    return { available: false, surface };
  }

  const sourceDir = join(kitRoot, 'templates', surface);
  const sources = SURFACE_SOURCES[surface];
  const destDeps = parseDependencies(await fs.readText(join(dest, 'package.json')));
  const rewrite = await planRewrite({ surface, dest, fs, appSurface, destDeps });

  const files = await planReportModeFiles({
    fs,
    sourceDir,
    dest,
    sources,
    applyRewrite: rewrite.applied,
  });
  if (files.length === 0) {
    throw new Error(
      `Report Mode source not found under templates/${surface}. Re-run from a kit workspace or with kit access.`,
    );
  }

  const utilsFile = files.find((file) => file.relativePath === UTILS_FILE);
  const willWriteUtils = utilsFile !== undefined && !utilsFile.exists;
  const sourceDeps = parseDependencies(await fs.readText(join(sourceDir, 'package.json')));
  const deps = reportModeDependencies(surface, sourceDeps, willWriteUtils);
  const env = reportModeInstallEnv(surface, assistant);
  const mount = await planMount(fs, reportModeMountSpec(surface, dest, appSurface));

  const todos: string[] = [];
  if (assistant === null) {
    todos.push(
      'Run `vybekiit doctor` to set your assistant key so Report Mode knows where to hand off.',
    );
  }
  if (sources.assumedPresent.length > 0) {
    todos.push(
      `Report Mode also imports these files that ship in every VybeKiit ${surface} app: ${sources.assumedPresent.join(', ')}. Add them first if your project predates them.`,
    );
  }
  if (mount.status === 'todo') {
    todos.push(
      `Mount Report Mode in ${relative(dest, mount.path) || mount.path}: add \`${mount.importSnippet}\` and render \`${mount.jsxSnippet}\` in the layout.`,
    );
  }

  return {
    available: true,
    surface,
    dest,
    files,
    deps,
    env,
    rewrite,
    mount,
    assumedPresent: sources.assumedPresent,
    todos,
    nextCommands: assistant === null ? ['vybekiit doctor'] : [],
  };
};

/** Side-effect seams for {@link applyReportModeInstall} (defaults reuse the shipped writers). */
export type ApplySeams = {
  readonly fs: ReportModeFs;
  readonly ensureDeps: (
    pkgPath: string,
    deps: Record<string, string>,
  ) => Promise<readonly string[]>;
  readonly writeEnv: (dest: string, env: Record<string, string>) => void;
};

const defaultApplySeams: ApplySeams = {
  fs: defaultReportModeFs,
  ensureDeps: ensureDependencies,
  writeEnv: writeEnvKeys,
};

/** What an apply run actually changed on disk. */
export type ApplyReportModeResult = {
  readonly written: readonly string[];
  readonly skipped: readonly string[];
  readonly depsAdded: readonly string[];
  readonly envKeys: readonly string[];
  readonly mount: MountPlan['status'];
};

/**
 * Apply an installable plan: copy files (skip when they exist unless `force`), upsert missing
 * dependencies, write env keys, and mount into the root layout when the plan resolved it.
 *
 * @param plan - Installable plan from {@link planReportModeInstall}.
 * @param options - Whether to overwrite existing files.
 * @param seams - Injectable side-effect seams (defaults reuse the shipped writers).
 * @returns Files written/skipped, dependencies added, env keys set, and final mount status.
 */
export const applyReportModeInstall = async (
  plan: InstallableReportModePlan,
  options: { readonly force: boolean } = { force: false },
  seams: ApplySeams = defaultApplySeams,
): Promise<ApplyReportModeResult> => {
  const outcomes = await Promise.all(
    plan.files.map(async (file) => {
      if (file.exists && !options.force) {
        return { kind: 'skipped' as const, path: file.relativePath };
      }
      await seams.fs.writeText(file.absolutePath, file.content);
      return { kind: 'written' as const, path: file.relativePath };
    }),
  );
  const written = outcomes.filter((row) => row.kind === 'written').map((row) => row.path);
  const skipped = outcomes.filter((row) => row.kind === 'skipped').map((row) => row.path);

  const depsAdded = await seams.ensureDeps(join(plan.dest, 'package.json'), plan.deps);
  if (Object.keys(plan.env).length > 0) {
    seams.writeEnv(plan.dest, plan.env);
  }
  if (plan.mount.status === 'inserted' && plan.mount.newContent !== undefined) {
    await seams.fs.writeText(plan.mount.path, plan.mount.newContent);
  }

  return {
    written,
    skipped,
    depsAdded,
    envKeys: Object.keys(plan.env),
    mount: plan.mount.status,
  };
};
