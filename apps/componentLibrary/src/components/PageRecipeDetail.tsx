'use client';

import { CopyPageRecipePromptButton } from '@library/components/CopyPageRecipePromptButton';
import { CopyPageRecipeSourceButton } from '@library/components/CopyPageRecipeSourceButton';
import { PageRecipePreviewGrid } from '@library/components/PageRecipePreviewGrid';
import { PageContainer } from '@library/components/shell/PageContainer';
import { PageHeader } from '@library/components/shell/PageHeader';
import type { PageRecipe } from '@library/data/pageRecipes';
import {
  type ComponentStateTone,
  componentStateMeta,
  isComponentStateId,
} from '@library/lib/componentStates';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface PageRecipeDetailProps {
  readonly recipe: PageRecipe;
}

const STATE_BADGE_VARIANT: Readonly<
  Record<ComponentStateTone, 'default' | 'secondary' | 'destructive' | 'outline'>
> = {
  neutral: 'outline',
  muted: 'outline',
  info: 'secondary',
  destructive: 'destructive',
  success: 'default',
};

/**
 * Render the Page recipe detail route.
 *
 * @param props - Props passed to this component.
 * @returns A React element for full Page recipe inspection.
 * @example
 * const element = <PageRecipeDetail recipe={recipe} />;
 */
export const PageRecipeDetail = ({ recipe }: PageRecipeDetailProps) => (
  <PageContainer size="wide">
    <PageHeader
      actions={
        <>
          <CopyPageRecipeSourceButton recipe={recipe} />
          <CopyPageRecipePromptButton recipe={recipe} />
          <Button asChild={true} size="sm" variant="outline">
            <Link href={`/embed/pages/${recipe.slug}`} target="_blank">
              Full preview
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
      backLink={{ href: '/pages', label: 'Back to Pages' }}
      description={recipe.summary}
      eyebrow={
        <>
          <Badge variant="secondary">{recipe.groupLabel}</Badge>
          <code className="rounded bg-muted px-2 py-0.5 text-xs">{recipe.targetRoute}</code>
        </>
      }
      title={recipe.title}
    >
      {recipe.statesCovered.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            States
          </span>
          {recipe.statesCovered.map((state) =>
            isComponentStateId(state) ? (
              <Badge key={state} variant={STATE_BADGE_VARIANT[componentStateMeta(state).tone]}>
                {componentStateMeta(state).label}
              </Badge>
            ) : null,
          )}
        </div>
      ) : null}
    </PageHeader>

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
  </PageContainer>
);
