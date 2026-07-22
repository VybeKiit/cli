import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { ensureDependencies } from './packageJsonDeps';
import {
  applyReportModeInstall,
  type InstallableReportModePlan,
  planReportModeInstall,
  type ReportModeFs,
} from './reportModeInstall';

const KIT = '/kit';
const DEST = '/app';

/** Temp dirs created by disk-backed cases (only `ensureDependencies`), cleaned after the run. */
const dirsToClean: string[] = [];
afterAll(async () => {
  await Promise.all(dirsToClean.map((dir) => rm(dir, { recursive: true, force: true })));
});

/** Build an in-memory {@link ReportModeFs} over a flat path → content map. */
const makeFs = (seed: Record<string, string>): { fs: ReportModeFs; store: Map<string, string> } => {
  const store = new Map(Object.entries(seed));
  const fs: ReportModeFs = {
    listFiles: async (dir) => {
      const prefix = `${dir}/`;
      const names: string[] = [];
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
          names.push(key.slice(prefix.length));
        }
      }
      return names;
    },
    readText: async (path) => store.get(path) ?? null,
    exists: async (path) => {
      if (store.has(path)) {
        return true;
      }
      const prefix = `${path}/`;
      for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
          return true;
        }
      }
      return false;
    },
    writeText: async (path, content) => {
      store.set(path, content);
    },
  };
  return { fs, store };
};

const REPORT_DEV_WEB =
  "import { usePathname } from '@/i18n/navigation';\nexport const ReportModeDev = () => null;\n";

/** Seed a representative web kit source tree at `templates/web`. */
const webSource = (): Record<string, string> => ({
  [`${KIT}/templates/web/src/components/report-mode/report-mode-dev.tsx`]: REPORT_DEV_WEB,
  [`${KIT}/templates/web/src/components/report-mode/report-mode-shell.tsx`]:
    'export const ReportModeDevShell = () => null;\n',
  [`${KIT}/templates/web/src/components/report-mode/dock/utils/report-dock-utils.ts`]:
    'export const x = 1;\n',
  [`${KIT}/templates/web/src/lib/report-mode/submitReport.ts`]:
    'export const submit = () => undefined;\n',
  [`${KIT}/templates/web/src/components/walkthrough/walkthrough.tsx`]:
    'export const Walkthrough = () => null;\n',
  [`${KIT}/templates/web/src/components/walkthrough/index.ts`]:
    "export { Walkthrough } from './walkthrough';\n",
  [`${KIT}/templates/web/src/lib/nodeEnv.ts`]: 'export const readNodeEnv = () => ({});\n',
  [`${KIT}/templates/web/src/lib/utils.ts`]: "export { cn } from 'cnfast';\n",
  [`${KIT}/templates/web/package.json`]: JSON.stringify({
    dependencies: { sonner: '^2.0.7', cnfast: '^0.0.8' },
  }),
});

const mobileSource = (): Record<string, string> => ({
  [`${KIT}/templates/mobile/src/components/report-mode/report-mode-dev.tsx`]:
    'export const ReportModeDev = () => null;\n',
  [`${KIT}/templates/mobile/src/lib/report-mode/submitReport.ts`]:
    'export const submit = () => undefined;\n',
  [`${KIT}/templates/mobile/src/lib/nodeEnv.ts`]: 'export const readNodeEnv = () => ({});\n',
  [`${KIT}/templates/mobile/package.json`]: JSON.stringify({ dependencies: {} }),
});

const extensionSource = (): Record<string, string> => ({
  [`${KIT}/templates/extension/src/components/report-mode/report-mode-dev.tsx`]:
    'export const ReportModeDev = () => null;\n',
  [`${KIT}/templates/extension/src/lib/report-mode/submitReport.ts`]:
    'export const submit = () => undefined;\n',
  [`${KIT}/templates/extension/src/lib/utils.ts`]: "export { cn } from 'cnfast';\n",
  [`${KIT}/templates/extension/styles/report-mode-note.css`]: '.note {}\n',
  [`${KIT}/templates/extension/package.json`]: JSON.stringify({
    dependencies: { cnfast: '^0.0.8' },
  }),
});

/** Narrow a plan to its installable branch for assertions (fails loudly otherwise). */
const asInstallable = (
  plan: Awaited<ReturnType<typeof planReportModeInstall>>,
): InstallableReportModePlan => {
  if (!plan.available) {
    throw new Error(`expected installable plan, got not-available for ${plan.surface}`);
  }
  return plan;
};

describe('planReportModeInstall — per-surface copy closure', () => {
  it('enumerates report-mode + lib + walkthrough subtrees for web', async () => {
    const { fs } = makeFs(webSource());
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        fs,
      }),
    );
    const paths = plan.files.map((file) => file.relativePath);
    expect(paths).toContain('src/components/report-mode/report-mode-dev.tsx');
    expect(paths).toContain('src/components/report-mode/dock/utils/report-dock-utils.ts');
    expect(paths).toContain('src/lib/report-mode/submitReport.ts');
    // walkthrough is report-mode-tutorial's sole consumer and MUST be pulled in for web.
    expect(paths).toContain('src/components/walkthrough/walkthrough.tsx');
    // copy-if-missing companions.
    expect(paths).toContain('src/lib/nodeEnv.ts');
    expect(paths).toContain('src/lib/utils.ts');
  });

  it('does NOT pull walkthrough for mobile/extension', async () => {
    const { fs } = makeFs(mobileSource());
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'mobile',
        assistant: 'claude',
        fs,
      }),
    );
    const paths = plan.files.map((file) => file.relativePath);
    expect(paths.some((path) => path.includes('walkthrough'))).toBe(false);
    expect(paths).toContain('src/components/report-mode/report-mode-dev.tsx');
    expect(paths).toContain('src/lib/nodeEnv.ts');
  });
});

describe('applyReportModeInstall — skip-if-exists', () => {
  const noopSeams = (fs: ReportModeFs) => ({
    fs,
    ensureDeps: async () => [] as readonly string[],
    writeEnv: () => undefined,
  });

  it('skips files that already exist unless force', async () => {
    const seed = webSource();
    // Pre-existing owned file at the destination simulates a partial older install.
    seed[`${DEST}/src/lib/report-mode/submitReport.ts`] = 'export const submit = () => 1;\n';
    const { fs } = makeFs(seed);
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: null,
        fs,
      }),
    );

    const noForce = await applyReportModeInstall(plan, { force: false }, noopSeams(fs));
    expect(noForce.skipped).toContain('src/lib/report-mode/submitReport.ts');
    expect(noForce.written).not.toContain('src/lib/report-mode/submitReport.ts');
    expect(noForce.written).toContain('src/components/report-mode/report-mode-dev.tsx');

    const forced = await applyReportModeInstall(plan, { force: true }, noopSeams(fs));
    expect(forced.written).toContain('src/lib/report-mode/submitReport.ts');
    expect(forced.skipped).toHaveLength(0);
  });
});

describe('planReportModeInstall — dependency set', () => {
  it('injects report-mode + ui + walkthrough (workspace) + sonner + cnfast for a fresh web app', async () => {
    const { fs } = makeFs(webSource());
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        fs,
      }),
    );
    expect(plan.deps['@vybekiit/report-mode']).toBe('workspace:*');
    expect(plan.deps['@vybekiit/ui']).toBe('workspace:*');
    expect(plan.deps['@vybekiit/walkthrough']).toBe('workspace:*');
    expect(plan.deps.sonner).toBe('^2.0.7');
    // utils.ts is missing at the dest, so its cnfast dependency is injected.
    expect(plan.deps.cnfast).toBe('^0.0.8');
  });

  it('omits cnfast when utils.ts already exists at the destination', async () => {
    const seed = webSource();
    seed[`${DEST}/src/lib/utils.ts`] = "export { cn } from 'clsx';\n";
    const { fs } = makeFs(seed);
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        fs,
      }),
    );
    expect(plan.deps.cnfast).toBeUndefined();
  });

  it('injects only report-mode (workspace) for mobile', async () => {
    const { fs } = makeFs(mobileSource());
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'mobile',
        assistant: 'claude',
        fs,
      }),
    );
    expect(plan.deps).toEqual({ '@vybekiit/report-mode': 'workspace:*' });
  });

  it('ensureDependencies upserts missing keys and never downgrades existing versions', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vybe-deps-'));
    dirsToClean.push(dir);
    const pkgPath = join(dir, 'package.json');
    await writeFile(pkgPath, JSON.stringify({ dependencies: { sonner: '^1.0.0' } }), 'utf8');

    const added = await ensureDependencies(pkgPath, {
      sonner: '^2.0.7',
      '@vybekiit/report-mode': 'workspace:*',
    });

    const result = JSON.parse(await readFile(pkgPath, 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(added).toEqual(['@vybekiit/report-mode']);
    expect(result.dependencies.sonner).toBe('^1.0.0');
    expect(result.dependencies['@vybekiit/report-mode']).toBe('workspace:*');
  });
});

describe('planReportModeInstall — env plan', () => {
  it('writes the gate plus the surface assistant key when an assistant is resolved', async () => {
    const { fs } = makeFs(webSource());
    const web = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        fs,
      }),
    );
    expect(web.env).toEqual({ VYBE_REPORT_MODE: '1', VYBE_ASSISTANT: 'claude' });

    const { fs: mobileFs } = makeFs(mobileSource());
    const mobile = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'mobile',
        assistant: 'cursor',
        fs: mobileFs,
      }),
    );
    expect(mobile.env).toEqual({ VYBE_REPORT_MODE: '1', EXPO_PUBLIC_VYBE_ASSISTANT: 'cursor' });

    const { fs: extFs } = makeFs(extensionSource());
    const extension = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'extension',
        assistant: 'codex',
        fs: extFs,
      }),
    );
    expect(extension.env).toEqual({ VYBE_REPORT_MODE: '1', WXT_PUBLIC_VYBE_ASSISTANT: 'codex' });
  });

  it('writes only the gate (plus a doctor todo) when no assistant is resolved', async () => {
    const { fs } = makeFs(webSource());
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: null,
        fs,
      }),
    );
    expect(plan.env).toEqual({ VYBE_REPORT_MODE: '1' });
    expect(plan.todos.some((todo) => todo.includes('vybekiit doctor'))).toBe(true);
  });
});

describe('planReportModeInstall — i18n rewrite', () => {
  it('rewrites @/i18n/navigation to next/navigation for a non-next-intl web app', async () => {
    const { fs } = makeFs(webSource());
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        fs,
      }),
    );
    expect(plan.rewrite.applied).toBe(true);
    const dev = plan.files.find(
      (file) => file.relativePath === 'src/components/report-mode/report-mode-dev.tsx',
    );
    expect(dev?.content).toContain("from 'next/navigation'");
    expect(dev?.content).not.toContain('@/i18n/navigation');
  });

  it('is a no-op when the buyer uses next-intl (dependency signal)', async () => {
    const seed = webSource();
    seed[`${DEST}/package.json`] = JSON.stringify({ dependencies: { 'next-intl': '^3.0.0' } });
    const { fs } = makeFs(seed);
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        fs,
      }),
    );
    expect(plan.rewrite.applied).toBe(false);
    const dev = plan.files.find(
      (file) => file.relativePath === 'src/components/report-mode/report-mode-dev.tsx',
    );
    expect(dev?.content).toContain('@/i18n/navigation');
  });

  it('is a no-op when the layout uses a locale segment', async () => {
    const { fs } = makeFs(webSource());
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        appSurface: {
          appRoot: DEST,
          appDir: `${DEST}/app`,
          usesLocaleSegment: true,
          componentsDir: `${DEST}/src/components/pageRecipes`,
        },
        fs,
      }),
    );
    expect(plan.rewrite.applied).toBe(false);
  });
});

describe('planReportModeInstall — mount detection', () => {
  it('plans an insert for a single-</body> layout without the mount', async () => {
    const seed = webSource();
    seed[`${DEST}/src/app/layout.tsx`] =
      "import type { ReactNode } from 'react';\nexport default function Layout({ children }: { children: ReactNode }) {\n  return (\n    <html>\n      <body>{children}</body>\n    </html>\n  );\n}\n";
    const { fs } = makeFs(seed);
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        fs,
      }),
    );
    expect(plan.mount.status).toBe('inserted');
    expect(plan.mount.newContent).toContain(
      "import { ReportModeDevShell } from '@/components/report-mode/report-mode-shell';",
    );
    expect(plan.mount.newContent).toContain('<ReportModeDevShell />');
  });

  it('mounts into the locale layout, ignoring a root passthrough with no </body>', async () => {
    const seed = webSource();
    seed[`${DEST}/app/layout.tsx`] =
      'const RootLayout = ({ children }: { children: unknown }) => children;\nexport default RootLayout;\n';
    seed[`${DEST}/app/[locale]/layout.tsx`] =
      "import type { ReactNode } from 'react';\nexport default function LocaleLayout({ children }: { children: ReactNode }) {\n  return (\n    <html>\n      <body>{children}</body>\n    </html>\n  );\n}\n";
    const { fs } = makeFs(seed);
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        appSurface: {
          appRoot: DEST,
          appDir: `${DEST}/app`,
          usesLocaleSegment: true,
          componentsDir: `${DEST}/src/components/pageRecipes`,
        },
        fs,
      }),
    );
    expect(plan.mount.status).toBe('inserted');
    expect(plan.mount.path).toBe(`${DEST}/app/[locale]/layout.tsx`);
    expect(plan.mount.newContent).toContain('<ReportModeDevShell />');
  });

  it('reports already when the layout already imports the shell', async () => {
    const seed = webSource();
    seed[`${DEST}/src/app/layout.tsx`] =
      "import { ReportModeDevShell } from '@/components/report-mode/report-mode-shell';\nexport default function Layout() {\n  return (\n    <html>\n      <body>\n        <ReportModeDevShell />\n      </body>\n    </html>\n  );\n}\n";
    const { fs } = makeFs(seed);
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        fs,
      }),
    );
    expect(plan.mount.status).toBe('already');
    expect(plan.mount.newContent).toBeUndefined();
  });

  it('falls back to a todo when no layout is found', async () => {
    const { fs } = makeFs(webSource());
    const plan = asInstallable(
      await planReportModeInstall({
        kitRoot: KIT,
        dest: DEST,
        surface: 'web',
        assistant: 'claude',
        fs,
      }),
    );
    expect(plan.mount.status).toBe('todo');
    expect(plan.todos.some((todo) => todo.includes('Mount Report Mode'))).toBe(true);
  });
});

describe('planReportModeInstall — unsupported surfaces', () => {
  it('returns a clean not-available result for spa and backend (no crash)', async () => {
    const { fs } = makeFs({});
    const spa = await planReportModeInstall({
      kitRoot: KIT,
      dest: DEST,
      surface: 'spa',
      assistant: null,
      fs,
    });
    const backend = await planReportModeInstall({
      kitRoot: KIT,
      dest: DEST,
      surface: 'backend',
      assistant: null,
      fs,
    });
    expect(spa).toEqual({ available: false, surface: 'spa' });
    expect(backend).toEqual({ available: false, surface: 'backend' });
  });
});
