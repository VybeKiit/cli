import type { PageRecipe } from '@library/data/pageRecipes';

/**
 * Whether a page recipe matches a free-text search query.
 *
 * @param recipe - Recipe to test.
 * @param query - User search string (case-insensitive substring).
 * @returns True when the query is empty or hits title/summary/todos/notes.
 * @example
 * recipeMatchesQuery(recipe, 'billing'); // true when summary mentions billing
 */
export const recipeMatchesQuery = (recipe: PageRecipe, query: string): boolean => {
  if (query.trim() === '') {
    return true;
  }
  const haystack = [
    recipe.title,
    recipe.summary,
    recipe.groupLabel,
    recipe.targetRoute,
    recipe.exportName,
    ...recipe.todos,
    ...recipe.installNotes.map((note) => note.note),
  ].join(' ');
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
};
