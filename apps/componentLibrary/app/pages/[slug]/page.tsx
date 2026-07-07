import { PageRecipeDetail } from '@library/components/PageRecipeDetail';
import { PAGE_RECIPE_BY_SLUG, PAGE_RECIPES } from '@library/data/pageRecipes';
import { notFound } from 'next/navigation';

interface PageRecipeRouteProps {
  readonly params: Promise<{
    readonly slug: string;
  }>;
}

/**
 * Generate static route params for Page recipe details.
 *
 * @returns Static params for every generated Page recipe.
 * @example
 * const params = generateStaticParams();
 */
export const generateStaticParams = () => PAGE_RECIPES.map((recipe) => ({ slug: recipe.slug }));

/**
 * Render the Page recipe detail route.
 *
 * @param props - Route props supplied by Next.js.
 * @returns The Page recipe detail page.
 * @example
 * const element = await PageRecipeRoute({ params });
 */
const PageRecipeRoute = async ({ params }: PageRecipeRouteProps) => {
  const { slug } = await params;
  const recipe = PAGE_RECIPE_BY_SLUG[slug];

  if (recipe === undefined) {
    notFound();
  }

  return <PageRecipeDetail recipe={recipe} />;
};

export default PageRecipeRoute;
