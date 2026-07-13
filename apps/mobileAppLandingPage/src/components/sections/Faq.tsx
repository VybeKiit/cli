import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@vybekiit/ui/accordion';
import { ShieldCheck } from 'lucide-react';

import { SectionShell } from '@/components/ui/SectionShell';
import { FAQ_HEADING, FAQ_ITEMS } from '@/data/landingContent';

/**
 * FAQ section — a heading, a privacy aside, and the `Accordion` primitive whose
 * items map from the `FAQ_ITEMS` data array (kit Accordion, not a raw-button list).
 *
 * @returns The rendered FAQ section.
 * @example
 * <Faq />
 */
export const Faq = () => (
  <SectionShell className="py-20 md:py-28" id="faq">
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{FAQ_HEADING.title}</h2>
    </div>

    <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
      <aside className="rounded-2xl border border-border bg-muted/40 p-6 md:col-span-1">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h3 className="mt-3 text-lg font-semibold">{FAQ_HEADING.asideTitle}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{FAQ_HEADING.asideBody}</p>
      </aside>

      <div className="md:col-span-2">
        <Accordion className="w-full" collapsible={true} type="single">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.key} value={item.key}>
              <AccordionTrigger className="text-base">{item.question}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </SectionShell>
);
