import { Badge } from '@vybekiit/ui/badge';
import { IPhoneMockup } from '@vybekiit-template-web/components/deviceMockups/iphoneMockup';
import {
  AppStoreButton,
  GooglePlayButton,
} from '@vybekiit-template-web/components/untitled/buttons/app-store-buttons';

import { AppDashboard } from '@/components/mock/AppDashboard';
import { SectionShell } from '@/components/ui/SectionShell';
import { StarRating } from '@/components/ui/StarRating';
import { HERO } from '@/data/landingContent';

/**
 * Centered hero — eyebrow pill, headline with the accented word "app", subhead,
 * store badges, a star-rating line, and the phone mockup framing the app dashboard.
 *
 * @returns The rendered Hero element.
 * @example
 * <Hero />
 */
export const Hero = () => (
  <SectionShell className="relative overflow-hidden pt-16 pb-0 text-center md:pt-24" id="top">
    <div className="flex justify-center">
      <Badge className="gap-1.5 rounded-full px-3 py-1" variant="secondary">
        {HERO.eyebrow}
      </Badge>
    </div>

    <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
      {HERO.headlineLead}
      <br />
      {HERO.headlineRestLead}
      <span className="text-primary">{HERO.headlineHighlight}</span>.
    </h1>

    <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">{HERO.subhead}</p>

    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <AppStoreButton size="lg" />
      <GooglePlayButton size="lg" />
    </div>

    <div className="mt-5 flex items-center justify-center gap-2">
      <StarRating filled={HERO.ratingStars} />
      <span className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{HERO.ratingValue}</span> ·{' '}
        {HERO.ratingCount}
      </span>
    </div>

    <div className="relative mt-14 flex justify-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-1/3 bg-primary/5"
      />
      <IPhoneMockup
        className="relative"
        color="silver"
        model="15-pro"
        screenBg="hsl(0 0% 100%)"
        shadow={true}
      >
        <AppDashboard />
      </IPhoneMockup>
    </div>
  </SectionShell>
);
