'use client';

import { BrandRichText } from '@/components/landing/BrandRichText';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { TypewriterText } from '@/components/ui/TypewriterText';
import type { VisitorCoverage } from '@/data/visitorLanding';
import { VISITOR_COMPARE } from '@/data/visitorLanding';
import { cn } from '@/lib/utils';

/** Glyph + accessible label for a yes / partial / no cell. */
const COVERAGE_DISPLAY: Record<
  VisitorCoverage,
  { readonly glyph: string; readonly label: string; readonly className: string }
> = {
  yes: { glyph: '✓', label: 'Yes', className: 'text-blue-600' },
  partial: { glyph: '~', label: 'Partial', className: 'text-amber-600' },
  no: { glyph: '×', label: 'No', className: 'text-muted-foreground/45' },
};

interface CoverageCellProps {
  readonly value: VisitorCoverage;
}

/**
 * One coverage cell in the visitor comparison matrix.
 *
 * @param props - Coverage value.
 * @returns Table cell with glyph + screen-reader label.
 * @example
 * <CoverageCell value="yes" />
 */
const CoverageCell = ({ value }: CoverageCellProps) => {
  const { glyph, label, className } = COVERAGE_DISPLAY[value];
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
export const Comparison = () => (
  <section id="compare" className="border-border/60 border-t">
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 aria-label={VISITOR_COMPARE.heading} className="text-balance">
          <code className="compare-code-heading inline-flex min-h-[3.2em] w-full max-w-full items-start justify-center rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-start font-mono text-[1.05rem] font-semibold leading-snug tracking-tight text-foreground sm:min-h-[2.8em] sm:px-4 sm:py-2.5 sm:text-2xl md:text-[1.7rem]">
            <span className="me-1.5 shrink-0 select-none text-emerald-600/90" aria-hidden={true}>
              {'>'}
            </span>
            <TypewriterText
              as="span"
              className="min-w-0 flex-1 whitespace-pre-wrap text-start"
              humanPace={true}
              msPerChar={32}
              text={VISITOR_COMPARE.heading}
            />
          </code>
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">{VISITOR_COMPARE.subhead}</p>
      </div>
      <div className="mt-10 overflow-x-auto rounded-xl border border-border shadow-sm">
        <table className="w-full min-w-[780px] border-collapse text-sm">
          <thead>
            <tr className="border-border border-b bg-muted/40 text-start">
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">Kit</th>
              {VISITOR_COMPARE.axes.map((axis) => (
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
                <CoverageCell value={row.agentOperates} />
                <CoverageCell value={row.plainLanguage} />
                <CoverageCell value={row.updatesInstall} />
                <CoverageCell value={row.threePlatforms} />
                <CoverageCell value={row.taxesHandled} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mx-auto mt-5 max-w-3xl text-center text-muted-foreground text-xs leading-relaxed">
        <BrandRichText text={VISITOR_COMPARE.footnote} />
      </p>
    </div>
  </section>
);
