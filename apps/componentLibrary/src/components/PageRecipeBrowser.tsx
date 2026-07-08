'use client';

import { CatalogSidebar } from '@library/components/CatalogSidebar';
import { PageRecipeCard } from '@library/components/PageRecipeCard';
import { PAGE_RECIPE_GROUPS, PAGE_RECIPES, type PageRecipe } from '@library/data/pageRecipes';
import { useClientReady } from '@library/hooks/useClientReady';
import { useDebouncedValue } from '@library/hooks/useDebouncedValue';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@vybekiit/ui/sidebar';
import { useRouter } from 'next/navigation';
import { type ChangeEvent, useCallback, useMemo, useState } from 'react';

const groupSummaries = PAGE_RECIPE_GROUPS.map((group) => ({
  id: group.id,
  label: group.label,
  count: PAGE_RECIPES.filter((recipe) => recipe.groupId === group.id).length,
}));

const recipeMatchesQuery = (recipe: PageRecipe, query: string): boolean => {
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

interface PageRecipeBrowserProps {
  readonly initialGroupId?: string;
}

type PageRecipeBrowserGroup = (typeof PAGE_RECIPE_GROUPS)[number];

interface GroupedPageRecipes {
  readonly group: PageRecipeBrowserGroup;
  readonly recipes: readonly PageRecipe[];
}

const safeInitialGroupId = (groupId: string | undefined): string => {
  if (groupId !== undefined && groupSummaries.some((group) => group.id === groupId)) {
    return groupId;
  }
  return 'all';
};

const PageRecipeSections = ({ grouped }: { readonly grouped: readonly GroupedPageRecipes[] }) => (
  <div className="space-y-8">
    {grouped.map(({ group, recipes }) => (
      <section key={group.id}>
        <div className="mb-3">
          <h2 className="font-semibold text-xl">{group.label}</h2>
          <p className="text-muted-foreground text-sm">{group.description}</p>
        </div>
        <div className="grid gap-4">
          {recipes.map((recipe) => (
            <PageRecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
    ))}
    {grouped.length === 0 ? (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
        No page recipes match this search.
      </div>
    ) : null}
  </div>
);

/**
 * Render the Page recipe catalog browser.
 *
 * @param props - Props passed to the Page recipe browser.
 * @returns A React element for browsing source-backed Page recipes.
 * @example
 * const element = <PageRecipeBrowser initialGroupId="payments" />;
 */
export const PageRecipeBrowser = ({ initialGroupId }: PageRecipeBrowserProps) => {
  const router = useRouter();
  const ready = useClientReady();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [groupId, setGroupId] = useState(safeInitialGroupId(initialGroupId));

  const handleGroupChange = useCallback(
    (nextGroupId: string) => {
      setGroupId(nextGroupId);
      router.replace(nextGroupId === 'all' ? '/pages' : `/pages?group=${nextGroupId}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  const recipes = useMemo(
    () =>
      PAGE_RECIPES.filter((recipe) => {
        if (groupId !== 'all' && recipe.groupId !== groupId) {
          return false;
        }
        return recipeMatchesQuery(recipe, debouncedQuery);
      }),
    [debouncedQuery, groupId],
  );

  const grouped = useMemo(
    () =>
      PAGE_RECIPE_GROUPS.map((group) => ({
        group,
        recipes: recipes.filter((recipe) => recipe.groupId === group.id),
      })).filter((group) => group.recipes.length > 0),
    [recipes],
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <CatalogSidebar
        activePageGroup={groupId}
        onPageGroupChange={handleGroupChange}
        pageGroups={groupSummaries}
        surface="pages"
      />
      <SidebarInset className="pb-24">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ms-1" />
          <span className="font-semibold text-sm">Pages</span>
        </header>

        <main className="flex-1 p-6 md:p-8" data-page-recipes-ready={ready ? 'true' : 'false'}>
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium text-muted-foreground text-sm">
                VybeKiit · ui.vybekiit.com
              </p>
              <h1 className="mt-1 font-bold text-3xl tracking-tight">Page Recipes</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Source-backed SaaS pages with desktop, tablet, and mobile previews. Copy the page
                component or copy the install prompt for your coding agent.
              </p>
            </div>
          </header>

          <div className="mb-6">
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              onChange={handleQueryChange}
              placeholder="Search page recipes"
              type="search"
              value={query}
            />
          </div>

          <PageRecipeSections grouped={grouped} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
