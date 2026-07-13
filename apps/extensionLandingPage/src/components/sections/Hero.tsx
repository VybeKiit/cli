import { BrowserWindow } from '@vybekiit-template-web/components/cult/mock-browser-window';
import { Sparkles } from 'lucide-react';

import { ExtensionDashboard } from '@/components/mock/ExtensionDashboard';
import { AddToBrowserButtons } from '@/components/ui/AddToBrowserButton';
import { SectionShell } from '@/components/ui/SectionShell';
import { StarRating } from '@/components/ui/StarRating';
import { HERO } from '@/data/landingContent';

/**
 * Hero — left column holds the eyebrow, split headline (accent second line),
 * subhead, the Chrome/Edge install buttons, a star rating line, and trust
 * chips. The right column shows a chrome `BrowserWindow` wrapping the rebuilt
 * extension dashboard mock.
 *
 * @returns The rendered Hero element.
 * @example
 * <Hero />
 */
export const Hero = () => (
  <SectionShell className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24" id="top">
    <div className="flex flex-col items-start text-left">
      <p className="mb-5 inline-flex items-center gap-1.5 font-semibold text-primary text-sm">
        <Sparkles className="h-4 w-4" />
        {HERO.eyebrow}
      </p>
      <h1 className="font-bold text-4xl leading-[1.1] tracking-tight md:text-6xl">
        <span className="block">{HERO.headline}</span>
        <span className="block text-primary">{HERO.headlineAccent}</span>
      </h1>
      <p className="mt-6 max-w-md text-lg text-muted-foreground">{HERO.subhead}</p>

      <AddToBrowserButtons className="mt-8" />

      <div className="mt-5 flex items-center gap-2 text-sm">
        <StarRating className="text-amber-400" />
        <span className="font-semibold">{HERO.rating}</span>
        <span className="text-muted-foreground">{HERO.ratingSuffix}</span>
      </div>

      <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground text-sm">
        {HERO.trustChips.map((chip) => (
          <li className="flex items-center gap-1.5" key={chip}>
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
            {chip}
          </li>
        ))}
      </ul>
    </div>

    <div className="relative">
      <BrowserWindow
        className="w-full"
        headerStyle="full"
        size="lg"
        url="chrome://newtab — New Tab"
        variant="chrome"
      >
        <ExtensionDashboard />
      </BrowserWindow>
    </div>
  </SectionShell>
);
