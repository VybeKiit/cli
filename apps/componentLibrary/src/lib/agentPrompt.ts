import type { CatalogEntry } from '@library/data/catalog';
import type { PageRecipe } from '@library/data/pageRecipes';
import { categoryLabelFromSlug } from '@library/lib/categoryLabels';
import { sourceLabelFor } from '@library/lib/sourceLabels';

const catalogBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://ui.vybekiit.com';
};

/**
 * Component preview url.
 *
 * @param entry - Catalog entry to render or describe.
 * @returns The value produced by componentPreviewUrl.
 * @example
 * const result = componentPreviewUrl(entry);
 */
export const componentPreviewUrl = (entry: CatalogEntry): string =>
  `${catalogBaseUrl()}/components/${entry.namespace}/${encodeURIComponent(entry.name)}`;

/**
 * Page recipe preview url.
 *
 * @param recipe - Page recipe to preview or install.
 * @returns Absolute component-library URL for the Page recipe detail route.
 * @example
 * const url = pageRecipePreviewUrl(recipe);
 */
export const pageRecipePreviewUrl = (recipe: PageRecipe): string =>
  `${catalogBaseUrl()}/pages/${encodeURIComponent(recipe.slug)}`;

/**
 * Build an agent-ready prompt for one mirrored catalog entry.
 *
 * @param entry - Catalog entry to describe for the user's coding agent.
 * @returns Markdown prompt text with source, import, category, and preview context.
 * @example
 * const prompt = buildComponentAgentPrompt(entry);
 */
export const buildComponentAgentPrompt = (entry: CatalogEntry): string => {
  const preview = componentPreviewUrl(entry);
  const library = sourceLabelFor(entry.namespace);

  return [
    'Implement this VybeKiit UI component in my app.',
    '',
    `Component: **${entry.name}**`,
    `Library: ${library} (\`${entry.namespace}\`)`,
    `Import path: \`${entry.importPath}\``,
    `Category: ${categoryLabelFromSlug(entry.category)}`,
    `Kind: ${entry.kind}`,
    `Live preview: ${preview}`,
    '',
    'The source is already mirrored in the VybeKiit web template under `src/components/`.',
    'Normalize to kit primitives and `@vybekiit/tokens` per `.vybekiit/agent/ui-consistency-vybekiit.md`.',
    'Pick from `.vybekiit/agent/ui-sources.md` rules — do not swap libraries.',
    '',
    'Wire this component into the screen or flow I describe next.',
  ].join('\n');
};

/**
 * Build an agent-ready prompt for a selection of mirrored entries.
 *
 * @param entries - Catalog entries selected by the maintainer in the library tray.
 * @returns Markdown prompt text that lists every selected component and preview URL.
 * @example
 * const prompt = buildBulkAgentPrompt(entries);
 */
export const buildBulkAgentPrompt = (entries: CatalogEntry[]): string => {
  if (entries.length === 0) {
    return '';
  }
  if (entries.length === 1) {
    return buildComponentAgentPrompt(entries[0]!);
  }

  const lines = [
    `Implement the following ${entries.length} VybeKiit UI components in my app.`,
    '',
    'Each block is already mirrored in the web template. Normalize every import to kit primitives per `.vybekiit/agent/ui-consistency-vybekiit.md`.',
    '',
  ];

  entries.forEach((entry, index) => {
    lines.push(
      `${index + 1}. **${entry.name}** (${sourceLabelFor(entry.namespace)})`,
      `   - Import: \`${entry.importPath}\``,
      `   - Category: ${categoryLabelFromSlug(entry.category)}`,
      `   - Preview: ${componentPreviewUrl(entry)}`,
      '',
    );
  });

  lines.push('Compose them together on the page or flow I describe next.');

  return lines.join('\n');
};

/**
 * Build an agent-ready prompt for a source-backed Page recipe.
 *
 * @param recipe - Page recipe to install.
 * @returns Markdown prompt text with route, source, notes, and provider-owned setup.
 * @example
 * const prompt = buildPageRecipeAgentPrompt(recipe);
 */
export const buildPageRecipeAgentPrompt = (recipe: PageRecipe): string => {
  const lines = [
    'Install this VybeKiit Page recipe in my app.',
    '',
    `Recipe: **${recipe.title}**`,
    `Feature group: ${recipe.groupLabel}`,
    `Target route: \`${recipe.targetRoute}\``,
    `Source export: \`${recipe.exportName}\` from \`${recipe.sourcePath}\``,
    `Full preview: ${pageRecipePreviewUrl(recipe)}`,
    '',
    'Install notes:',
    ...recipe.installNotes.map((note) => `- ${note.label}: ${note.note}`),
    '',
  ];

  if (recipe.providerPointers.length > 0) {
    lines.push(
      'Provider-owned setup:',
      ...recipe.providerPointers.map((pointer) => `- ${pointer.provider}: ${pointer.note}`),
      '',
    );
  }

  if (recipe.todos.length > 0) {
    lines.push(
      'Source TODOs to wire after copying:',
      ...recipe.todos.map((todo) => `- TODO: ${todo}`),
      '',
    );
  }

  lines.push(
    'Acceptance checks:',
    ...recipe.acceptanceChecks.map((check) => `- ${check}`),
    '',
    'Copy the source component from the Page recipe catalog, add it to the target route, then connect only the TODO-marked integration points.',
  );

  return lines.join('\n');
};
