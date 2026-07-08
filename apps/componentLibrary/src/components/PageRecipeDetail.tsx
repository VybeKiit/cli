'use client';

import { CatalogSidebar } from '@library/components/CatalogSidebar';
import { CopyPageRecipePromptButton } from '@library/components/CopyPageRecipePromptButton';
import { CopyPageRecipeSourceButton } from '@library/components/CopyPageRecipeSourceButton';
import { PageRecipePreviewGrid } from '@library/components/PageRecipePreviewGrid';
import { PAGE_RECIPE_GROUPS, PAGE_RECIPES, type PageRecipe } from '@library/data/pageRecipes';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@vybekiit/ui/sidebar';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface PageRecipeDetailProps {
  readonly recipe: PageRecipe;
}

const groupSummaries = PAGE_RECIPE_GROUPS.map((group) => ({
  id: group.id,
  label: group.label,
  count: PAGE_RECIPES.filter((recipe) => recipe.groupId === group.id).length,
}));

/**
 * Render the Page recipe detail route.
 *
 * @param props - Props passed to this component.
 * @returns A React element for full Page recipe inspection.
 * @example
 * const element = <PageRecipeDetail recipe={recipe} />;
 */
export const PageRecipeDetail = ({ recipe }: PageRecipeDetailProps) => {
  const router = useRouter();
  const handleGroupChange = useCallback(
    (groupId: string) => {
      router.push(groupId === 'all' ? '/pages' : `/pages?group=${groupId}`);
    },
    [router],
  );

  return (
    <SidebarProvider defaultOpen={true}>
      <CatalogSidebar
        activePageGroup={recipe.groupId}
        onPageGroupChange={handleGroupChange}
        pageGroups={groupSummaries}
        surface="pages"
      />
      <SidebarInset className="pb-24">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger className="-ms-1" />
          <span className="font-semibold text-sm">Pages</span>
        </header>

        <main className="mx-auto w-full max-w-7xl p-6 md:p-8">
          <Link
            className="inline-flex items-center gap-2 text-muted-foreground text-sm"
            href="/pages"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pages
          </Link>

          <header className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{recipe.groupLabel}</Badge>
                <code className="rounded bg-muted px-2 py-0.5 text-xs">{recipe.targetRoute}</code>
              </div>
              <h1 className="font-bold text-3xl tracking-tight">{recipe.title}</h1>
              <p className="mt-2 max-w-3xl text-muted-foreground">{recipe.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyPageRecipeSourceButton recipe={recipe} />
              <CopyPageRecipePromptButton recipe={recipe} />
              <Button asChild={true} size="sm" variant="outline">
                <Link href={`/embed/pages/${recipe.slug}`} target="_blank">
                  Full preview
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </header>

          <section className="mt-8">
            <h2 className="mb-3 font-semibold text-lg">Responsive preview</h2>
            <PageRecipePreviewGrid slug={recipe.slug} title={recipe.title} />
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold text-lg">Install notes</h2>
              <div className="mt-4 space-y-3">
                {recipe.installNotes.map((note) => (
                  <div className="rounded-lg border p-3" key={`${recipe.id}-${note.label}`}>
                    <p className="font-medium text-sm">{note.label}</p>
                    <p className="mt-1 text-muted-foreground text-sm">{note.note}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold text-lg">Acceptance checks</h2>
              <ul className="mt-4 space-y-2 text-sm">
                {recipe.acceptanceChecks.map((check) => (
                  <li className="rounded-lg border p-3" key={check}>
                    {check}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="mt-8 rounded-lg border bg-card p-5">
            <h2 className="font-semibold text-lg">Source</h2>
            <pre className="mt-4 max-h-[520px] overflow-auto rounded-lg bg-muted p-4 text-xs">
              <code>{recipe.sourceCode}</code>
            </pre>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
