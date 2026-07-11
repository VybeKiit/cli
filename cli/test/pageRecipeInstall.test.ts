import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { PageRecipeSummary } from '../src/lib/pageRecipeCatalog';
import { findPageRecipe, loadPageRecipes } from '../src/lib/pageRecipeCatalog';
import { collectSharedImports, rewriteInstalledSource } from '../src/lib/pageRecipeImports';
import { planPageRecipeInstall } from '../src/lib/pageRecipeInstall';
import { buildRouteStub } from '../src/lib/pageRecipeRouteStub';
import { resolveKitSource } from '../src/lib/resolveKitSource';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

/**
 * Create a temp directory tracked for cleanup.
 *
 * @returns Absolute temp path.
 */
const makeTemp = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), 'vybekiit-pieces-'));
  tempDirs.push(dir);
  return dir;
};

describe('collectSharedImports', () => {
  it('finds ./shared and ../shared imports as module stems', () => {
    const source = `
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from "./shared/DemoTransitionStage";
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { Button } from '@vybekiit/ui/button';
`;
    expect(collectSharedImports(source)).toEqual([
      'DemoThemeRandomizer',
      'DemoTransitionStage',
      'DemoPlugInPanel',
    ]);
  });
});

describe('rewriteInstalledSource', () => {
  it('rewrites gallery theme imports to local helpers', () => {
    const source = "import { hexToHslTriplet } from '@library/lib/theme';\n";
    expect(rewriteInstalledSource(source)).toContain("from './themeHelpers'");
    expect(rewriteInstalledSource(source)).not.toContain('@library');
  });
});

describe('buildRouteStub', () => {
  it('emits a default-export page that renders the recipe', () => {
    const stub = buildRouteStub('CartPage', '@/components/pageRecipes/CartPage', '/cart');
    expect(stub).toContain("import { CartPage } from '@/components/pageRecipes/CartPage'");
    expect(stub).toContain('const Page = () => <CartPage />');
    expect(stub).toContain('export default Page');
  });
});

describe('planPageRecipeInstall cart', () => {
  it('loads the monorepo catalog and plans a cart install', async () => {
    const { kitRoot, cleanup } = await resolveKitSource();
    try {
      const recipes = await loadPageRecipes(kitRoot);
      expect(recipes.length).toBeGreaterThan(10);
      const cart = findPageRecipe(recipes, 'cart');
      expect(cart).toBeDefined();
      if (cart === undefined) {
        return;
      }

      const dest = await makeTemp();
      await mkdir(join(dest, 'app', '[locale]'), { recursive: true });
      await writeFile(
        join(dest, 'package.json'),
        JSON.stringify({ name: 'test-app', private: true }),
      );
      await mkdir(join(dest, 'src'), { recursive: true });

      const plan = await planPageRecipeInstall({ kitRoot, dest, recipe: cart });
      expect(plan.recipeId).toBe('cart');
      expect(plan.targetRoute).toBe('/cart');
      expect(plan.files.some((file) => file.kind === 'component')).toBe(true);
      expect(plan.files.some((file) => file.kind === 'shared')).toBe(true);
      expect(plan.files.some((file) => file.kind === 'route')).toBe(true);
      expect(plan.linkedPresets.length).toBeGreaterThan(0);
      expect(plan.nextCommands.some((cmd) => cmd.includes('apply-preset'))).toBe(true);
    } finally {
      if (cleanup !== undefined) {
        await cleanup();
      }
    }
  });
});

describe('planPageRecipeInstall bare dest', () => {
  it('plans without a route file when app/ is missing', async () => {
    const { kitRoot, cleanup } = await resolveKitSource();
    try {
      const recipes = await loadPageRecipes(kitRoot);
      const pricing = findPageRecipe(recipes, 'pricing');
      expect(pricing).toBeDefined();
      if (pricing === undefined) {
        return;
      }

      const dest = await makeTemp();
      await writeFile(
        join(dest, 'package.json'),
        JSON.stringify({ name: 'bare-app', private: true }),
      );
      await mkdir(join(dest, 'src'), { recursive: true });

      const plan = await planPageRecipeInstall({ kitRoot, dest, recipe: pricing });
      expect(plan.files.every((file) => file.kind !== 'route')).toBe(true);
      expect(plan.files.some((file) => file.kind === 'component')).toBe(true);
    } finally {
      if (cleanup !== undefined) {
        await cleanup();
      }
    }
  });
});

describe('applyPageRecipeInstall smoke', () => {
  it('writes component + shared + route under a fake web app', async () => {
    const { kitRoot, cleanup } = await resolveKitSource();
    try {
      const recipes = await loadPageRecipes(kitRoot);
      const recipe = findPageRecipe(recipes, 'onboarding');
      expect(recipe).toBeDefined();
      if (recipe === undefined) {
        return;
      }

      const dest = await makeTemp();
      await mkdir(join(dest, 'app', '[locale]'), { recursive: true });
      await writeFile(
        join(dest, 'package.json'),
        JSON.stringify({ name: 'onboard-app', private: true }),
      );
      await mkdir(join(dest, 'src'), { recursive: true });

      const { applyPageRecipeInstall } = await import('../src/lib/pageRecipeInstall');
      const plan = await planPageRecipeInstall({ kitRoot, dest, recipe });
      const { written } = await applyPageRecipeInstall(plan, { force: false });
      expect(written.length).toBeGreaterThan(0);

      const component = plan.files.find((file) => file.kind === 'component');
      expect(component).toBeDefined();
      if (component === undefined) {
        return;
      }
      const body = await readFile(component.absolutePath, 'utf8');
      expect(body).toContain('OnboardingPage');
    } finally {
      if (cleanup !== undefined) {
        await cleanup();
      }
    }
  });
});

describe('PageRecipeSummary typing smoke', () => {
  it('accepts a minimal summary shape', () => {
    const summary: PageRecipeSummary = {
      id: 'x',
      slug: 'x',
      title: 'X',
      summary: '',
      sourcePath: 'apps/componentLibrary/src/pageRecipes/X.tsx',
      exportName: 'XPage',
      targetRoute: '/x',
      suggestedComponents: [],
      installNotes: [],
      acceptanceChecks: [],
      groupId: 'g',
      groupLabel: 'G',
      groupDescription: '',
      presetIds: [],
      goalIds: [],
      providerPointers: [],
    };
    expect(summary.id).toBe('x');
  });
});
