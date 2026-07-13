import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@vybekiit/ui/accordion';
import { Lock } from 'lucide-react';

import { SectionShell } from '@/components/ui/SectionShell';
import { FAQ, FAQ_ITEMS, PRIVACY_CALLOUT } from '@/data/landingContent';

/**
 * FAQ — a heading, an `Accordion` whose items are mapped from `FAQ_ITEMS`, and
 * an accent privacy callout card beside it (matching the reference two-column layout).
 *
 * @returns The rendered FAQ section.
 * @example
 * <Faq />
 */
export const Faq = () => (
  <SectionShell className="py-16 md:py-24" id="faq">
    <p className="text-center font-semibold text-primary text-xs tracking-widest">{FAQ.eyebrow}</p>
    <h2 className="mt-3 text-center font-bold text-3xl tracking-tight md:text-4xl">
      {FAQ.heading}
    </h2>

    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <Accordion className="w-full" collapsible={true} type="single">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.key} value={item.key}>
            <AccordionTrigger className="text-base">{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div
        className="flex flex-col items-center justify-center rounded-2xl bg-primary/5 p-8 text-center"
        id="privacy"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </span>
        <p className="mt-4 font-semibold text-lg">{PRIVACY_CALLOUT.title}</p>
        <p className="mt-2 max-w-xs text-muted-foreground text-sm">{PRIVACY_CALLOUT.body}</p>
        <a
          className="mt-4 font-semibold text-primary text-sm hover:underline"
          href={PRIVACY_CALLOUT.linkHref}
        >
          {PRIVACY_CALLOUT.linkLabel} →
        </a>
      </div>
    </div>
  </SectionShell>
);
