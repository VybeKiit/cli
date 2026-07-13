/**
 * Sidebar group chips for the Pages surface (all groups + counts). Re-exported from the generated
 * `pageRecipeGroups` module so shell + nav consumers can list Page recipe groups without statically
 * importing the heavy `pageRecipes` blob. SSOT for browser and detail routes so groups never drift.
 */

export type { PageRecipeGroupSummary } from '@library/data/pageRecipeGroups';
export { PAGE_RECIPE_GROUP_SUMMARIES } from '@library/data/pageRecipeGroups';
