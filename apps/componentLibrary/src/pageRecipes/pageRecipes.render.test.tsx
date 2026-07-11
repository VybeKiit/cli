import { PAGE_RECIPE_COMPONENTS } from '@library/data/pageRecipeComponents';
import { PAGE_RECIPES } from '@library/data/pageRecipes';
import { render } from '@testing-library/react';
import { createElement } from 'react';

/**
 * Table-driven smoke: every registered page recipe mounts without throwing.
 * Interaction / visual coverage lives in Playwright (`e2e/page-recipes-all.spec.ts`).
 */
describe('page recipes render', () => {
  it('registers a component for every PAGE_RECIPES entry', () => {
    for (const recipe of PAGE_RECIPES) {
      expect(PAGE_RECIPE_COMPONENTS[recipe.slug]).toBeTypeOf('function');
    }
  });

  for (const recipe of PAGE_RECIPES) {
    it(`renders ${recipe.slug} without throwing`, () => {
      const Recipe = PAGE_RECIPE_COMPONENTS[recipe.slug];
      expect(Recipe).toBeDefined();
      if (Recipe === undefined) {
        return;
      }
      const { container, unmount } = render(createElement(Recipe));
      expect(container.childElementCount).toBeGreaterThan(0);
      unmount();
    });
  }
});
