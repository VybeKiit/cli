import { AnimatedCounter } from '@vybekiit/ui/animated-counter';
import { Kpi } from '@vybekiit/ui/kpi';

import { SectionShell } from '@/components/ui/SectionShell';
import { StarRating } from '@/components/ui/StarRating';
import { STAT_TILES, type StatTile, TRUSTED_STATS } from '@/data/landingContent';

/**
 * Render a stat tile's value — a count-up for numeric metrics, an optional star
 * row above rating tiles, or the raw string for the editor's-choice tile.
 *
 * @param tile - The stat tile record to render the value for.
 * @returns The value node passed into the `Kpi` tile.
 * @example
 * <Kpi label={tile.label} value={renderStatValue(tile)} />
 */
const renderStatValue = (tile: StatTile) => {
  const value =
    typeof tile.value === 'number' ? (
      <AnimatedCounter
        className="text-2xl text-primary"
        prefix={tile.prefix ?? ''}
        suffix={tile.suffix ?? ''}
        value={tile.value}
      />
    ) : (
      <span className="text-primary">{tile.value}</span>
    );

  if (tile.rated === true) {
    return (
      <span className="flex flex-col items-center gap-1">
        {value}
        <StarRating className="text-amber-400" starClassName="h-3 w-3" />
      </span>
    );
  }
  return value;
};

/**
 * Trusted-by stats bar — a lead label and four `Kpi` tiles mapped from
 * `STAT_TILES`, with numeric metrics animating via `AnimatedCounter`.
 *
 * @returns The rendered stats bar.
 * @example
 * <TrustedStats />
 */
export const TrustedStats = () => (
  <SectionShell className="py-8">
    <div className="rounded-2xl border bg-muted/30 p-6 md:p-8">
      <div className="grid items-center gap-6 md:grid-cols-5">
        <p className="font-semibold text-lg md:col-span-1">{TRUSTED_STATS.heading}</p>
        <div className="grid grid-cols-2 gap-4 md:col-span-4 md:grid-cols-4">
          {STAT_TILES.map((tile) => (
            <Kpi
              className="border-none bg-transparent shadow-none"
              key={tile.key}
              label={tile.label}
              value={renderStatValue(tile)}
            />
          ))}
        </div>
      </div>
    </div>
  </SectionShell>
);
