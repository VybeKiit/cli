import { PAGE_RECIPES, type PageRecipe } from '@library/data/pageRecipes';

/**
 * Resolve the page recipe backing a template preview.
 *
 * @param slug - Page recipe slug from template surface data.
 * @returns The matching page recipe.
 * @throws When no recipe matches the slug.
 * @example
 * const recipe = recipeBySlug('auth');
 */
export const recipeBySlug = (slug: string): PageRecipe => {
  const recipe = PAGE_RECIPES.find((candidate) => candidate.slug === slug);
  if (recipe === undefined) {
    throw new Error(`Missing page recipe for template surface preview: ${slug}`);
  }
  return recipe;
};
