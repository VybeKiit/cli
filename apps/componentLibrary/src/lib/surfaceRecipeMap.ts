import { PAGE_RECIPE_BY_SLUG } from '@library/data/pageRecipes';
import type { TemplateSurface } from '@library/data/templateSurfaces';

/**
 * The few page-recipe fields a template surface preview renders — never the heavy `sourceCode`, so
 * the projection stays tiny when serialized from the server route to the client browser.
 */
export interface TemplateSurfaceRecipeRef {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly groupLabel: string;
}

/**
 * Resolve every page recipe a template surface references, projected to the fields its previews
 * render. Called from the server route so the 815 KB `pageRecipes` blob never enters a template
 * client chunk (only this map — a handful of small refs — crosses to the client).
 *
 * @param surface - Template surface whose recipe slugs need resolving.
 * @returns A slug → recipe-reference map for every slug the surface references.
 * @throws When a referenced slug has no backing page recipe.
 * @example
 * const recipes = surfaceRecipeMap(surface);
 */
export const surfaceRecipeMap = (
  surface: TemplateSurface,
): Readonly<Record<string, TemplateSurfaceRecipeRef>> => {
  const slugs = new Set<string>([
    ...surface.recipeSlugs,
    ...surface.previews.map((preview) => preview.slug),
    ...surface.appRoutes.map((route) => route.recipeSlug),
  ]);

  const map: Record<string, TemplateSurfaceRecipeRef> = {};
  for (const slug of slugs) {
    const recipe = PAGE_RECIPE_BY_SLUG[slug];
    if (recipe === undefined) {
      throw new Error(`Missing page recipe for template surface ${surface.id}: ${slug}`);
    }
    map[slug] = {
      id: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      summary: recipe.summary,
      groupLabel: recipe.groupLabel,
    };
  }
  return map;
};
