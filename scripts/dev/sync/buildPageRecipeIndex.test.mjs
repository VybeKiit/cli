import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildGeneratedPageRecipeComponentsSource,
  buildGeneratedPageRecipeSource,
  readDbPresetIds,
  readWebGoalIds,
  validatePageRecipeManifest,
} from './buildPageRecipeIndex.mjs';

const makeTempRepo = async () => {
  const root = await mkdtemp(join(tmpdir(), 'vybekiit-page-recipes-'));
  await mkdir(join(root, 'packages/db/presets/orders'), { recursive: true });
  await mkdir(join(root, 'packages/db/presets/auth-bridge'), { recursive: true });
  await mkdir(join(root, 'packages/agentKit/src/catalogs'), { recursive: true });
  await mkdir(join(root, 'apps/componentLibrary/src/pageRecipes'), { recursive: true });

  await writeFile(
    join(root, 'packages/db/presets/orders/preset.manifest.json'),
    JSON.stringify({ id: 'orders', skills: ['setup-payments'] }),
  );
  await writeFile(
    join(root, 'packages/db/presets/auth-bridge/preset.manifest.json'),
    JSON.stringify({ id: 'auth-bridge', skills: ['add-signin'] }),
  );
  await writeFile(
    join(root, 'packages/agentKit/src/catalogs/goalCatalog.ts'),
    `
export const GOAL_ENTRIES = [
  {
    id: 'setup-payments',
    skills: { web: 'setup-payments', mobile: null, extension: null, spa: null, backend: null },
  },
  {
    id: 'sign-in',
    skills: {
      web: 'add-signin',
      mobile: 'connect-account',
      extension: null,
      spa: 'connect-account',
      backend: null,
    },
  },
  {
    id: 'publish-app',
    skills: { web: null, mobile: 'publish-app', extension: null, spa: null, backend: null },
  },
];
`,
  );
  await writeFile(
    join(root, 'apps/componentLibrary/src/pageRecipes/AuthPage.tsx'),
    [
      "export const AuthPage = () => {",
      '  // TODO: Connect this form to the active Supabase auth provider.',
      "  return <main>Auth page</main>;",
      '};',
    ].join('\n'),
  );
  await writeFile(
    join(root, 'apps/componentLibrary/src/pageRecipes/PricingPage.tsx'),
    [
      "export const PricingPage = () => {",
      '  // TODO: Read plans from the active payment provider configuration.',
      "  return <main>Pricing page</main>;",
      '};',
    ].join('\n'),
  );

  return root;
};

const validManifest = {
  version: 1,
  groups: [
    {
      id: 'auth',
      label: 'Auth',
      description: 'Account access pages.',
      order: 1,
      presetIds: ['auth-bridge'],
      goalIds: ['sign-in'],
      recipes: [
        {
          id: 'auth',
          slug: 'auth',
          title: 'Auth page',
          summary: 'Sign in and sign up entry point.',
          sourcePath: 'apps/componentLibrary/src/pageRecipes/AuthPage.tsx',
          exportName: 'AuthPage',
          targetRoute: '/login',
          suggestedComponents: ['supabase/sign-in-forms-01'],
          installNotes: [
            {
              kind: 'service',
              label: 'Connect sign in',
              note: 'Connect this form to the active Supabase auth provider.',
              todo: 'Connect this form to the active Supabase auth provider.',
              owner: 'auth',
            },
          ],
          acceptanceChecks: ['The page renders without a configured backend.'],
        },
      ],
    },
    {
      id: 'payments',
      label: 'Payments',
      description: 'Pricing and checkout pages.',
      order: 2,
      presetIds: ['orders'],
      goalIds: ['setup-payments'],
      providerPointers: [
        {
          provider: 'payments',
          note: 'Change live prices in the active payment provider dashboard and config.',
        },
      ],
      recipes: [
        {
          id: 'pricing',
          slug: 'pricing',
          title: 'Pricing page',
          summary: 'Plan selection page.',
          sourcePath: 'apps/componentLibrary/src/pageRecipes/PricingPage.tsx',
          exportName: 'PricingPage',
          targetRoute: '/pricing',
          suggestedComponents: ['bundui/pricing-sections-01'],
          installNotes: [
            {
              kind: 'provider',
              label: 'Change live prices',
              note: 'Change live prices in the active payment provider dashboard and config.',
              todo: 'Read plans from the active payment provider configuration.',
              owner: 'payments',
            },
          ],
          acceptanceChecks: ['The page points price edits to provider setup.'],
        },
      ],
    },
  ],
};

describe('build page recipe index', () => {
  it('discovers DB preset IDs from preset manifests', async () => {
    const repoRoot = await makeTempRepo();

    await expect(readDbPresetIds(repoRoot)).resolves.toEqual(['auth-bridge', 'orders']);
  });

  it('discovers only web-facing goal IDs from goalCatalog.ts', async () => {
    const repoRoot = await makeTempRepo();

    await expect(readWebGoalIds(repoRoot)).resolves.toEqual(['setup-payments', 'sign-in']);
  });

  it('rejects missing preset and goal coverage', async () => {
    const repoRoot = await makeTempRepo();
    const manifest = {
      version: 1,
      groups: [validManifest.groups[0]],
    };

    await expect(validatePageRecipeManifest({ repoRoot, manifest })).rejects.toThrow(
      'Missing page recipe coverage for DB presets: orders',
    );
  });

  it('rejects payment recipes without provider pointers', async () => {
    const repoRoot = await makeTempRepo();
    const manifest = structuredClone(validManifest);
    delete manifest.groups[1].providerPointers;

    await expect(validatePageRecipeManifest({ repoRoot, manifest })).rejects.toThrow(
      'Payment recipe group payments must include a payments provider pointer',
    );
  });

  it('rejects source TODO comments without matching install notes', async () => {
    const repoRoot = await makeTempRepo();
    const manifest = structuredClone(validManifest);
    manifest.groups[0].recipes[0].installNotes = [
      {
        kind: 'visual',
        label: 'Change copy',
        note: 'Change the visible title and button text.',
        owner: 'page',
      },
    ];

    await expect(validatePageRecipeManifest({ repoRoot, manifest })).rejects.toThrow(
      'Recipe auth is missing install notes for TODO: Connect this form to the active Supabase auth provider.',
    );
  });

  it('generates typed page recipe data with source text', async () => {
    const repoRoot = await makeTempRepo();
    const index = await validatePageRecipeManifest({ repoRoot, manifest: validManifest });
    const generated = buildGeneratedPageRecipeSource(index);

    expect(generated).toContain('Generated by scripts/dev/sync/buildPageRecipeIndex.mjs');
    expect(generated).toContain('export interface PageRecipe');
    expect(generated).toContain('export const PAGE_RECIPES');
    expect(generated).toContain('Connect this form to the active Supabase auth provider.');
  });

  it('generates a static component registry for Next routes', async () => {
    const repoRoot = await makeTempRepo();
    const index = await validatePageRecipeManifest({ repoRoot, manifest: validManifest });
    const generated = buildGeneratedPageRecipeComponentsSource(index);

    expect(generated).toContain(
      "import { AuthPage } from '@library/pageRecipes/AuthPage';",
    );
    expect(generated).toContain("'auth': AuthPage");
    expect(generated).toContain('export const PAGE_RECIPE_COMPONENTS');
  });
});
