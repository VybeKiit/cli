import { PAGE_RECIPE_GROUPS, PAGE_RECIPES } from '@library/data/pageRecipes';

export interface PageRecipeGroupSummary {
  readonly id: string;
  readonly label: string;
  readonly count: number;
}

/**
 * Sidebar group chips for the Pages surface (all groups + counts).
 * SSOT for browser and detail routes so group lists never drift.
 */
export const PAGE_RECIPE_GROUP_SUMMARIES: readonly PageRecipeGroupSummary[] =
  PAGE_RECIPE_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    count: PAGE_RECIPES.filter((recipe) => recipe.groupId === group.id).length,
  }));
