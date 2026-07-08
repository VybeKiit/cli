import { PageRecipeEmbed } from '@library/components/PageRecipeEmbed';
import { PAGE_RECIPE_BY_SLUG, PAGE_RECIPES } from '@library/data/pageRecipes';
import { notFound } from 'next/navigation';

interface PageRecipeEmbedRouteProps {
  readonly params: Promise<{
    readonly slug: string;
  }>;
}

/**
 * Generate static route params for Page recipe embeds.
 *
 * @returns Static params for every generated Page recipe.
 * @example
 * const params = generateStaticParams();
 */
export const generateStaticParams = () => PAGE_RECIPES.map((recipe) => ({ slug: recipe.slug }));

/**
 * Render a clean Page recipe embed route.
 *
 * @param props - Route props supplied by Next.js.
 * @returns The Page recipe embed route.
 * @example
 * const element = await PageRecipeEmbedRoute({ params });
 */
const PageRecipeEmbedRoute = async ({ params }: PageRecipeEmbedRouteProps) => {
  const { slug } = await params;
  const recipe = PAGE_RECIPE_BY_SLUG[slug];

  if (recipe === undefined) {
    notFound();
  }

  return <PageRecipeEmbed slug={recipe.slug} />;
};

export default PageRecipeEmbedRoute;
