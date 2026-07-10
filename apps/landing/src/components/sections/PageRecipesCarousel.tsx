'use client';

import { PageRecipeCard } from '@/components/sections/PageRecipeCard';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';
import { TypewriterText } from '@/components/ui/TypewriterText';
import {
  PAGE_RECIPE_COUNT,
  PAGE_RECIPE_PREVIEWS,
  READY_PAGE_RECIPE_COUNT,
} from '@/data/pageRecipes';

const HEADLINE = `${READY_PAGE_RECIPE_COUNT} ready-to-drop-in product screens + full recipe catalog`;

/**
 * Full recipe catalog marquee with a scroll-triggered typewriter headline.
 * Featured row was removed; the infinite catalog is the single carousel here.
 *
 * @returns The rendered recipes section.
 * @example
 * <PageRecipesCarousel />
 */
export const PageRecipesCarousel = () => (
  <section id="page-recipes" className="border-border/60 border-t">
    <div className="mx-auto max-w-5xl px-6 pt-16 pb-4">
      <div className="mx-auto max-w-2xl text-center">
        <h2 aria-label={HEADLINE} className="text-balance">
          <TypewriterText
            as="span"
            className="inline-block min-h-[2.6em] w-full font-bold text-3xl tracking-tight sm:min-h-[1.9em]"
            humanPace={true}
            msPerChar={28}
            text={HEADLINE}
          />
        </h2>
        <p className="mt-3 font-medium text-sm text-primary tracking-wide sm:text-base">
          More to be added · Lifetime access
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Sign-in, dashboard, checkout, CRM, AI chat, and {PAGE_RECIPE_COUNT}+ page recipes ship as
          real product UI you can drop in. New screens keep landing after you buy: one purchase,
          lifetime access to everything we add.
        </p>
      </div>
    </div>

    <div className="overflow-visible pt-8 pb-20">
      <div className="mx-auto mb-2 max-w-5xl px-6">
        <p className="text-center font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
          Full recipe catalog · {PAGE_RECIPE_COUNT} pages
        </p>
      </div>
      <AutoScrollRow
        ariaLabel="Built-in page recipes catalog"
        className="page-recipes-carousel"
        durationDesktop="140s"
        durationMobile="100s"
        pauseOnHover={true}
        rowClassName="items-center py-6"
      >
        <ul className="flex items-center gap-5 pe-5">
          {PAGE_RECIPE_PREVIEWS.map((recipe) => (
            <PageRecipeCard
              key={recipe.id}
              instanceKey={recipe.id}
              recipe={recipe}
              size="compact"
            />
          ))}
        </ul>
      </AutoScrollRow>
    </div>
  </section>
);
