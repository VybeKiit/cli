'use client';

import { PageRecipeCard } from '@/components/sections/PageRecipeCard';
import { AutoScrollRow } from '@/components/ui/AutoScrollRow';
import { TypewriterText } from '@/components/ui/TypewriterText';
import {
  PAGE_RECIPE_COUNT,
  PAGE_RECIPE_PREVIEWS,
  READY_PAGE_RECIPE_COUNT,
} from '@/data/pageRecipes';
import { fillTemplate } from '@/i18n/fillTemplate';
import { useLandingLocale } from '@/i18n/LocaleProvider';

/**
 * Full recipe catalog marquee with a scroll-triggered typewriter headline.
 * Section chrome follows the active landing locale.
 *
 * @returns The rendered recipes section.
 * @example
 * <PageRecipesCarousel />
 */
export const PageRecipesCarousel = () => {
  const { messages, locale } = useLandingLocale();
  const copy = messages.pageRecipes;
  const headline = fillTemplate(copy.headline, { readyCount: READY_PAGE_RECIPE_COUNT });
  const body = fillTemplate(copy.body, { count: PAGE_RECIPE_COUNT });
  const catalogLabel = fillTemplate(copy.catalogLabel, { count: PAGE_RECIPE_COUNT });
  const catalogAria = copy.catalogAria;

  return (
    <section id="page-recipes" className="border-border/60 border-t">
      <div className="mx-auto max-w-5xl px-6 pt-16 pb-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 aria-label={headline} className="text-balance">
            <TypewriterText
              as="span"
              key={locale}
              className="inline-block min-h-[2.6em] w-full font-bold text-3xl tracking-tight sm:min-h-[1.9em]"
              humanPace={true}
              msPerChar={28}
              text={headline}
            />
          </h2>
          <p className="mt-3 font-medium text-sm text-primary tracking-wide sm:text-base">
            {copy.badge}
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">{body}</p>
        </div>
      </div>

      <div className="overflow-visible pt-8 pb-20">
        <div className="mx-auto mb-2 max-w-5xl px-6">
          <p className="text-center font-semibold text-xs text-muted-foreground uppercase tracking-[0.14em]">
            {catalogLabel}
          </p>
        </div>
        <AutoScrollRow
          ariaLabel={catalogAria}
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
};
