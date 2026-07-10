'use client';

import { BrandRichText } from '@/components/landing/BrandRichText';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { TypewriterText } from '@/components/ui/TypewriterText';
import type { VisitorCoverage } from '@/data/visitorLanding';
import { VISITOR_COMPARE } from '@/data/visitorLanding';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

interface CoverageCellProps {
  readonly value: VisitorCoverage;
  readonly labels: { readonly yes: string; readonly partial: string; readonly no: string };
}

/**
 * One coverage cell in the visitor comparison matrix.
 *
 * @param props - Coverage value and localized labels.
 * @returns Table cell with glyph + screen-reader label.
 * @example
 * <CoverageCell value="yes" labels={messages.compare.coverage} />
 */
const CoverageCell = ({ value, labels }: CoverageCellProps) => {
  const map = {
    yes: { glyph: '✓', label: labels.yes, className: 'text-blue-600' },
    partial: { glyph: '~', label: labels.partial, className: 'text-amber-600' },
    no: { glyph: '×', label: labels.no, className: 'text-muted-foreground/45' },
  } as const;
  const { glyph, label, className } = map[value];
  return (
    <td className="px-2 py-3 text-center sm:px-3">
      <span aria-hidden={true} className={cn('text-base font-medium', className)}>
        {glyph}
      </span>
      <span className="sr-only">{label}</span>
    </td>
  );
};

/**
 * Rival matrix for vibe coders: ship like an engineer without becoming one.
 * Prices roll into place as the table enters view.
 *
 * @returns The rendered comparison section.
 * @example
 * <Comparison />
 */
export const Comparison = () => {
  const { messages, locale } = useLandingLocale();
  const compare = messages.compare;
  const axes = [
    { key: 'price' as const, label: compare.axes.price },
    { key: 'agentOperates' as const, label: compare.axes.agentOperates },
    { key: 'plainLanguage' as const, label: compare.axes.plainLanguage },
    { key: 'updatesInstall' as const, label: compare.axes.updatesInstall },
    { key: 'threePlatforms' as const, label: compare.axes.threePlatforms },
    { key: 'taxesHandled' as const, label: compare.axes.taxesHandled },
  ];

  return (
    <section id="compare" className="border-border/60 border-t">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 aria-label={compare.heading} className="text-balance">
            <code className="compare-code-heading inline-flex min-h-[3.2em] w-full max-w-full items-start justify-center rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-start font-mono text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground sm:min-h-[2.8em] sm:px-4 sm:py-2.5 sm:text-2xl md:text-[1.7rem]">
              <span className="me-1.5 shrink-0 select-none text-emerald-600/90" aria-hidden={true}>
                {'>'}
              </span>
              <TypewriterText
                as="span"
                key={locale}
                className="min-w-0 flex-1 whitespace-pre-wrap text-start"
                humanPace={true}
                msPerChar={32}
                text={compare.heading}
              />
            </code>
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{compare.subhead}</p>
        </div>
        <div className="mt-10 overflow-x-auto rounded-xl border border-border shadow-sm">
          <table className="w-full min-w-[780px] border-collapse text-sm">
            <thead>
              <tr className="border-border border-b bg-muted/40 text-start">
                <th className="px-4 py-3 text-start font-medium text-muted-foreground">Kit</th>
                {axes.map((axis) => (
                  <th
                    key={axis.key}
                    className={cn(
                      'px-2 py-3 font-medium sm:px-3',
                      axis.key === 'price' ? 'text-start' : 'text-center',
                    )}
                  >
                    {axis.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VISITOR_COMPARE.rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-border border-b last:border-b-0',
                    row.featured && 'bg-blue-50/70 font-medium',
                  )}
                >
                  <td className="px-4 py-3 text-start">
                    {row.featured ? (
                      <span className="inline-flex items-center gap-2">
                        {row.name}
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 font-medium text-[10px] text-white tracking-wide">
                          You
                        </span>
                      </span>
                    ) : (
                      row.name
                    )}
                  </td>
                  <td className="px-2 py-3 text-start text-muted-foreground sm:px-3">
                    <AnimatedNumber value={row.price} />
                  </td>
                  <CoverageCell labels={compare.coverage} value={row.agentOperates} />
                  <CoverageCell labels={compare.coverage} value={row.plainLanguage} />
                  <CoverageCell labels={compare.coverage} value={row.updatesInstall} />
                  <CoverageCell labels={compare.coverage} value={row.threePlatforms} />
                  <CoverageCell labels={compare.coverage} value={row.taxesHandled} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mx-auto mt-5 max-w-3xl text-center text-muted-foreground text-xs leading-relaxed">
          <BrandRichText text={compare.footnote} />
        </p>
      </div>
    </section>
  );
};
