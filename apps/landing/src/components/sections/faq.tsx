'use client';

import { ChevronDown } from 'lucide-react';
import { useCallback, useId, useState } from 'react';
import { BrandRichText } from '@/components/landing/BrandRichText';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { trackClient } from '@/lib/analyticsClient';
import { AnalyticsEvent } from '@/lib/analyticsEvents';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface FaqItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

interface FaqRowProps {
  readonly item: FaqItem;
  readonly open: boolean;
  readonly onToggle: (id: string) => void;
  readonly panelId: string;
  readonly buttonId: string;
  readonly reduced: boolean;
}

/**
 * One FAQ row with height-smooth expand / collapse and chevron rotation.
 *
 * @param props - Row state and handlers.
 * @returns The rendered FAQ row.
 */
const FaqRow = ({ item, open, onToggle, panelId, buttonId, reduced }: FaqRowProps) => {
  const handleClick = useCallback(() => {
    onToggle(item.id);
    if (!open) {
      trackClient(AnalyticsEvent.faqOpened, {
        faq_id: item.id,
        question: item.question,
      });
    }
  }, [item.id, item.question, onToggle, open]);

  return (
    <div className="border-border border-b last:border-b-0">
      <h3 className="m-0">
        <button
          aria-controls={panelId}
          aria-expanded={open}
          className={cn(
            'flex w-full items-center justify-between gap-4 py-5 text-start transition-colors',
            'hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 focus-visible:ring-offset-2',
          )}
          id={buttonId}
          onClick={handleClick}
          type="button"
        >
          <span className="faq-question-rich font-medium text-base leading-[1.45] md:text-lg">
            <BrandRichText text={item.question} />
          </span>
          <span
            aria-hidden={true}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground',
              reduced ? '' : 'transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              open && 'rotate-180 border-blue-200 bg-blue-50 text-blue-600',
            )}
          >
            <ChevronDown className="size-4" strokeWidth={2.25} />
          </span>
        </button>
      </h3>
      <div
        aria-labelledby={buttonId}
        className={cn(
          'grid',
          !reduced &&
            'transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        id={panelId}
        role="region"
      >
        <div className="overflow-hidden">
          <p
            className={cn(
              'pb-5 text-muted-foreground text-sm leading-relaxed',
              reduced ? '' : 'transition-opacity duration-300',
              open ? 'opacity-100' : 'opacity-0',
            )}
          >
            <BrandRichText text={item.answer} />
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * FAQ for vibe coders: package choice first, smooth accordion open/close.
 * Tracks which questions buyers open (friction / objection signals).
 *
 * @returns The rendered FAQ section.
 * @example
 * <Faq />
 */
export const Faq = () => {
  const baseId = useId();
  const reduced = useReducedMotion();
  const { messages } = useLandingLocale();
  const items = messages.faq.items;
  const first = items[0];
  const [openId, setOpenId] = useState<string | null>(first === undefined ? null : first.id);

  const handleToggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  return (
    <section id="faq" className="border-border/60 border-t">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-widest">FAQ</p>
        <h2 className="mt-2 font-bold text-3xl tracking-tight">{messages.faq.heading}</h2>
        <div className="mt-10 rounded-2xl border border-border bg-card px-5 shadow-sm sm:px-6">
          {items.map((item, index) => (
            <FaqRow
              key={item.id}
              buttonId={`${baseId}-btn-${index}`}
              item={item}
              onToggle={handleToggle}
              open={openId === item.id}
              panelId={`${baseId}-panel-${index}`}
              reduced={reduced}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
