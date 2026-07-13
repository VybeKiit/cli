'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@vybekiit/ui/accordion';

const ITEMS = [
  {
    value: 'what',
    q: 'What is VybeKiit?',
    a: 'A starter kit that lets non-technical builders ship real, production-ready products.',
  },
  {
    value: 'who',
    q: 'Who is it for?',
    a: 'Founders and makers who want solid foundations without wiring up the boilerplate themselves.',
  },
  {
    value: 'refund',
    q: 'Do you offer refunds?',
    a: 'Yes — within 14 days of purchase, no questions asked.',
  },
] as const;

/** A real, expandable Accordion (single, collapsible). */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <Accordion className="w-full max-w-md" collapsible={true} defaultValue="what" type="single">
      {ITEMS.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

export default story;
