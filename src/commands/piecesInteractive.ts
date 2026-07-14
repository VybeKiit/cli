import process from 'node:process';
import { cancel, isCancel, select } from '@clack/prompts';
import { ALL_PRESETS } from '@vybekiit/db';
import { loadPageRecipes } from '../lib/pageRecipeCatalog';
import { resolveKitSource } from '../lib/resolveKitSource';
import { isInteractive } from '../prompts/tty';
import { runAddPageRecipe, runListPieces } from './piecesCmd';
import { runApplyPreset } from './presetsCmd';

/**
 * Interactive list path for the TTY add menu.
 *
 * @returns Exit code from list-pieces.
 * @example
 * const code = await runListPath();
 */
const runListPath = async (): Promise<number> => {
  const result = await runListPieces([]);
  process.stdout.write(`${result.json}\n`);
  return result.exitCode;
};

/**
 * Interactive database-preset dry-run path.
 *
 * @returns Exit code from apply-preset dry-run.
 * @example
 * const code = await runDbPresetPath();
 */
const runDbPresetPath = async (): Promise<number> => {
  const picked = await select({
    message: 'Which database preset?',
    options: ALL_PRESETS.map((preset) => ({
      value: preset.id,
      label: preset.id,
      hint:
        preset.description === undefined || preset.description === ''
          ? preset.id
          : preset.description,
    })),
  });
  if (isCancel(picked) || typeof picked !== 'string') {
    cancel('Cancelled.');
    return 1;
  }
  const result = await runApplyPreset([picked, '--dry-run']);
  process.stdout.write(`${result.json}\n`);
  process.stdout.write(
    '\nDry-run shown. Apply for real with: vybekiit apply-preset ' +
      `${picked}\n(Needs DATABASE_URL in the project.)\n`,
  );
  return result.exitCode;
};

/**
 * Interactive page-recipe install into the current folder.
 *
 * @returns Exit code from add page-recipe.
 * @example
 * const code = await runPageRecipePath();
 */
const runPageRecipePath = async (): Promise<number> => {
  let cleanup: (() => Promise<void>) | undefined;
  try {
    const resolved = await resolveKitSource();
    const { cleanup: resolvedCleanup, kitRoot } = resolved;
    cleanup = resolvedCleanup;
    const recipes = await loadPageRecipes(kitRoot);
    if (recipes.length === 0) {
      process.stderr.write('No page recipes available from the kit source.\n');
      return 1;
    }

    const picked = await select({
      message: 'Which page recipe?',
      options: recipes.map((recipe) => ({
        value: recipe.id,
        label: recipe.title,
        hint: `${recipe.groupLabel} · ${recipe.targetRoute}`,
      })),
    });
    if (isCancel(picked) || typeof picked !== 'string') {
      cancel('Cancelled.');
      return 1;
    }

    const result = await runAddPageRecipe([picked, '--to=.']);
    process.stdout.write(`${result.json}\n`);
    if (result.exitCode === 0) {
      process.stdout.write(
        `\nInstalled "${picked}" into the current folder. Wire the TODOs in the JSON report next.\n`,
      );
    }
    return result.exitCode;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    return 1;
  } finally {
    if (cleanup !== undefined) {
      await cleanup();
    }
  }
};

/**
 * Interactive TTY flow: pick a piece kind, then install/apply it.
 *
 * @returns Exit code from the chosen install path.
 * @example
 * const code = await runAddPiecesInteractive();
 */
export const runAddPiecesInteractive = async (): Promise<number> => {
  if (!isInteractive()) {
    process.stderr.write(
      'add requires arguments in non-interactive mode. Try: vybekiit list-pieces\n',
    );
    return 1;
  }

  const kind = await select({
    message: 'What kind of ready piece?',
    options: [
      {
        value: 'page-recipe',
        label: 'Page recipe (ready screen)',
        hint: 'Copy a full page into your app',
      },
      {
        value: 'db',
        label: 'Database preset',
        hint: 'Tables/schema for a feature',
      },
      {
        value: 'list',
        label: 'List everything (JSON)',
        hint: 'Agents use this catalog',
      },
    ],
  });

  if (isCancel(kind) || typeof kind !== 'string') {
    cancel('Cancelled.');
    return 1;
  }

  if (kind === 'list') {
    return runListPath();
  }
  if (kind === 'db') {
    return runDbPresetPath();
  }
  return runPageRecipePath();
};
