import { PAGE_RECIPE_COMPONENTS } from '@library/data/pageRecipeComponents';
import { PAGE_RECIPE_BY_SLUG } from '@library/data/pageRecipes';

interface PageRecipeEmbedProps {
  readonly slug: string;
}

/**
 * Render a Page recipe component inside an embed shell.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the clean Page recipe preview.
 * @example
 * const element = <PageRecipeEmbed slug="auth" />;
 */
export const PageRecipeEmbed = ({ slug }: PageRecipeEmbedProps) => {
  const RecipeComponent = PAGE_RECIPE_COMPONENTS[slug];
  const recipe = PAGE_RECIPE_BY_SLUG[slug];

  if (RecipeComponent === undefined || recipe === undefined) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground" data-page-recipe={recipe.slug}>
      <RecipeComponent />
    </div>
  );
};
