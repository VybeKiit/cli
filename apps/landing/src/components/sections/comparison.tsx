import {
  COMPARISON_AXES,
  COMPARISON_HONEST_NOTE,
  COMPARISON_ROWS,
  type Coverage,
} from '@/data/comparison';
import { cn } from '@/lib/utils';

/** Glyph + screen-reader label for each coverage state. */
const COVERAGE_DISPLAY: Record<Coverage, { glyph: string; label: string; className: string }> = {
  yes: { glyph: '✓', label: 'Yes', className: 'text-foreground' },
  partial: { glyph: '~', label: 'Partial', className: 'text-muted-foreground' },
  no: { glyph: '✕', label: 'No', className: 'text-muted-foreground/50' },
};

/** A single matrix cell: the coverage glyph with an accessible label. */
function CoverageCell({ value }: { value: Coverage }) {
  const { glyph, label, className } = COVERAGE_DISPLAY[value];
  return (
    <td className="px-4 py-3 text-center">
      <span aria-hidden={true} className={cn('text-base', className)}>
        {glyph}
      </span>
      <span className="sr-only">{label}</span>
    </td>
  );
}

/**
 * Comparison — the rival matrix on the axes that are VybeKiit's axis (operator,
 * npm updates, three platforms, MoR). Renders the typed `COMPARISON_ROWS`/`AXES`
 * data and prints the honest reading below, per the load-bearing honesty rule.
 * The table scrolls horizontally on narrow screens rather than breaking layout.
 */
export function Comparison() {
  return (
    <section id="compare" className="border-t">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-bold text-3xl tracking-tight">How VybeKiit compares</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Not on raw feature count — on the axis that matters for a non-technical founder.
        </p>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-start">
                <th className="px-4 py-3 text-start font-medium">Kit</th>
                <th className="px-4 py-3 text-start font-medium">Price</th>
                {COMPARISON_AXES.map((axis) => (
                  <th key={axis.key} className="px-4 py-3 text-center font-medium">
                    {axis.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr
                  key={row.id}
                  className={cn('border-b', row.featured && 'bg-muted/50 font-medium')}
                >
                  <td className="px-4 py-3 text-start">{row.name}</td>
                  <td className="px-4 py-3 text-start text-muted-foreground">{row.price}</td>
                  {COMPARISON_AXES.map((axis) => (
                    <CoverageCell key={axis.key} value={row[axis.key]} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 max-w-3xl text-muted-foreground text-sm leading-relaxed">
          {COMPARISON_HONEST_NOTE}
        </p>
      </div>
    </section>
  );
}
