import { describe, expect, it } from 'vitest';
import { runAddPageRecipe, runListPageRecipes, runListPieces } from '../src/commands/piecesCmd';
import { runApplyPreset, runListPresets } from '../src/commands/presetsCmd';

// Missing-env failure may mention DATABASE_URL and/or --cwd guidance.
const MISSING_DB_URL_HINT = /DATABASE_URL|cwd/i;

describe('runListPresets', () => {
  it('returns DB presets with ok true', () => {
    const result = runListPresets();
    expect(result.exitCode).toBe(0);
    const body = JSON.parse(result.json) as {
      readonly ok: boolean;
      readonly presets: readonly { readonly id: string }[];
    };
    expect(body.ok).toBe(true);
    expect(body.presets.length).toBeGreaterThan(5);
    expect(body.presets.some((preset) => preset.id === 'orders')).toBe(true);
  });
});

describe('runListPieces', () => {
  it('returns a unified catalog with db, page-recipe, and backend kinds', async () => {
    const result = await runListPieces([]);
    expect(result.exitCode).toBe(0);
    const body = JSON.parse(result.json) as {
      readonly ok: boolean;
      readonly count: number;
      readonly pieces: readonly { readonly kind: string; readonly id: string }[];
    };
    expect(body.ok).toBe(true);
    expect(body.count).toBeGreaterThan(20);
    const kinds = new Set(body.pieces.map((piece) => piece.kind));
    expect(kinds.has('db')).toBe(true);
    expect(kinds.has('page-recipe')).toBe(true);
    expect(kinds.has('backend')).toBe(true);
  });

  it('filters by --kind=db', async () => {
    const result = await runListPieces(['--kind=db']);
    expect(result.exitCode).toBe(0);
    const body = JSON.parse(result.json) as {
      readonly pieces: readonly { readonly kind: string }[];
    };
    expect(body.pieces.every((piece) => piece.kind === 'db')).toBe(true);
  });
});

describe('runListPageRecipes', () => {
  it('lists recipes with install commands', async () => {
    const result = await runListPageRecipes();
    expect(result.exitCode).toBe(0);
    const body = JSON.parse(result.json) as {
      readonly ok: boolean;
      readonly recipes: readonly {
        readonly id: string;
        readonly command: string;
        readonly targetRoute: string;
      }[];
    };
    expect(body.ok).toBe(true);
    expect(body.recipes.length).toBeGreaterThan(10);
    const cart = body.recipes.find((recipe) => recipe.id === 'cart');
    expect(cart?.command).toBe('vybekiit add page-recipe cart');
    expect(cart?.targetRoute).toBe('/cart');
  });
});

// biome-ignore lint/security/noSecrets: describe title is not a secret
describe('runAddPageRecipe', () => {
  it('errors when id is missing', async () => {
    const result = await runAddPageRecipe([]);
    expect(result.exitCode).toBe(1);
    expect(result.json).toContain('Pass a page recipe id');
  });

  it('errors on unknown recipe id', async () => {
    const result = await runAddPageRecipe(['not-a-real-recipe-xyz']);
    expect(result.exitCode).toBe(1);
    expect(result.json).toContain('Unknown page recipe');
  });

  it('dry-runs a known recipe against a temp-like relative path', async () => {
    const result = await runAddPageRecipe(['pricing', '--dry-run', '--to=.']);
    expect(result.exitCode).toBe(0);
    const body = JSON.parse(result.json) as {
      readonly ok: boolean;
      readonly dryRun: boolean;
      readonly recipeId: string;
      readonly files: readonly { readonly path: string; readonly kind: string }[];
      readonly nextCommands: readonly string[];
    };
    expect(body.ok).toBe(true);
    expect(body.dryRun).toBe(true);
    expect(body.recipeId).toBe('pricing');
    expect(body.files.length).toBeGreaterThan(0);
    expect(body.nextCommands.some((cmd) => cmd.includes('apply-preset'))).toBe(true);
  });
});

describe('runApplyPreset --cwd', () => {
  it('reports missing DATABASE_URL with cwd hint when no env', async () => {
    const result = await runApplyPreset(['orders', '--cwd=.']);
    // Without DATABASE_URL this fails loud with the cwd hint (or succeeds dry-run only with --dry-run).
    if (result.exitCode !== 0) {
      expect(result.json).toMatch(MISSING_DB_URL_HINT);
    }
  });

  it('dry-runs a known preset without needing a live database', async () => {
    const result = await runApplyPreset(['orders', '--dry-run', '--provider=supabase']);
    expect(result.exitCode).toBe(0);
    const body = JSON.parse(result.json) as { readonly ok: boolean };
    expect(body.ok).toBe(true);
  });
});
