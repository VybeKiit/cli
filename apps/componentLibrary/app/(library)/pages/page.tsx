import { PageRecipeBrowser } from '@library/components/PageRecipeBrowser';
import { PAGE_RECIPE_GROUPS, PAGE_RECIPES } from '@library/data/pageRecipes';

// Group headers only (no nested recipes) so the RSC payload doesn't serialize the recipe list twice.
const PAGE_RECIPE_GROUP_HEADERS = PAGE_RECIPE_GROUPS.map((group) => ({
  id: group.id,
  label: group.label,
  description: group.description,
}));

interface PagesRouteProps {
  readonly searchParams: Promise<{ group?: string }>;
}

/**
 * Render the Page recipe catalog route.
 *
 * The recipe data is imported here on the server and passed as props so the 815 KB `pageRecipes`
 * blob stays out of the client JS chunk.
 *
 * @param props - Props passed to this route.
 * @returns The Page recipe browser page.
 * @example
 * const element = await PagesRoute({ searchParams: Promise.resolve({ group: 'payments' }) });
 */
const PagesRoute = async ({ searchParams }: PagesRouteProps) => {
  const { group } = await searchParams;
  return (
    <PageRecipeBrowser
      groups={PAGE_RECIPE_GROUP_HEADERS}
      initialGroupId={group}
      recipes={PAGE_RECIPES}
    />
  );
};

export default PagesRoute;
