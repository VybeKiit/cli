'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { PreviewModeToggle } from '@library/components/PreviewModeToggle';
import { PrimaryPicker } from '@library/components/PrimaryPicker';
import {
  PREVIEW_SIZE_LABELS,
  type PreviewSize,
  type ViewportPreset,
} from '@library/lib/previewViewport';
import type { PreviewMode } from '@library/lib/theme';
import { Monitor, Ruler, Smartphone, Tablet } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIEWPORT_TABS: Array<{
  id: ViewportPreset;
  label: string;
  Icon: typeof Monitor;
  tip: string;
}> = [
  {
    id: 'desktop',
    label: 'Desktop',
    Icon: Monitor,
    tip: 'Full-width desktop preview — best for landing sections and dashboards.',
  },
  {
    id: 'tablet',
    label: 'Tablet',
    Icon: Tablet,
    tip: 'Tablet-width preview — useful for responsive layouts between phone and desktop.',
  },
  {
    id: 'mobile',
    label: 'Mobile',
    Icon: Smartphone,
    tip: 'Mobile preview with device mockup chrome — see how the block feels on a phone.',
  },
  {
    id: 'custom',
    label: 'Custom',
    Icon: Ruler,
    tip: 'Set an exact preview width in pixels to stress-test a breakpoint.',
  },
];

const SIZE_TIPS: Record<PreviewSize, string> = {
  s: 'Zoom the preview out — fit more context on screen.',
  m: 'Medium zoom — balanced detail and context.',
  l: 'Large zoom — default comfortable reading size.',
  xl: 'Extra-large zoom — inspect spacing and typography.',
  xxl: 'Maximum zoom — pixel-level inspection.',
};

const SIZE_OPTIONS: PreviewSize[] = ['s', 'm', 'l', 'xl', 'xxl'];

/**
 * Render the preview controls bar component.
 *
 * @param props - Props passed to this component.
 * @returns A React element for the component-library UI.
 * @example
 * const element = <PreviewControlsBar {...props} />;
 */
export const PreviewControlsBar = ({
  mode,
  onModeChange,
  compact = false,
  showPrimary = true,
  viewport,
  customWidth,
  size,
  onViewportChange,
  onCustomWidthChange,
  onSizeChange,
}: {
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  compact?: boolean;
  showPrimary?: boolean;
  viewport?: ViewportPreset;
  customWidth?: number;
  size?: PreviewSize;
  onViewportChange?: (preset: ViewportPreset) => void;
  onCustomWidthChange?: (width: number) => void;
  onSizeChange?: (size: PreviewSize) => void;
}) => {
  const showViewport = viewport !== undefined && onViewportChange !== undefined;
  const showSize = size !== undefined && onSizeChange !== undefined;

  return (
    <div className={cn('flex flex-col gap-3', compact && 'gap-2')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PreviewModeToggle mode={mode} onChange={onModeChange} />
        {showPrimary && !compact ? <PrimaryPicker /> : null}
      </div>

      {showViewport || showSize ? (
        <div className="flex flex-wrap items-center gap-3">
          {showViewport ? (
            <div className="inline-flex flex-wrap items-center rounded-md border border-border p-0.5">
              {VIEWPORT_TABS.map(({ id, label, Icon, tip }) => (
                <LayoutTooltip key={id} label={tip}>
                  <button
                    aria-label={label}
                    aria-pressed={viewport === id}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1 text-xs',
                      viewport === id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={() => onViewportChange(id)}
                    type="button"
                  >
                    <Icon className="size-3.5" />
                    {compact ? null : <span>{label}</span>}
                  </button>
                </LayoutTooltip>
              ))}
              {viewport === 'custom' && onCustomWidthChange && customWidth !== undefined ? (
                <LayoutTooltip label="Preview width in pixels — drag or type a value between 320 and 1600.">
                  <label className="ml-1 flex items-center gap-1 px-1 text-muted-foreground text-xs">
                    <input
                      className="w-16 rounded border border-border bg-background px-1 py-0.5 text-foreground text-xs"
                      max={1600}
                      min={320}
                      onChange={(event) => onCustomWidthChange(Number(event.target.value))}
                      step={10}
                      type="number"
                      value={customWidth}
                    />
                    <span>px</span>
                  </label>
                </LayoutTooltip>
              ) : null}
            </div>
          ) : null}

          {showSize ? (
            <div className="inline-flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Size</span>
              <div className="inline-flex rounded-md border border-border p-0.5">
                {SIZE_OPTIONS.map((option) => (
                  <LayoutTooltip key={option} label={SIZE_TIPS[option]}>
                    <button
                      aria-pressed={size === option}
                      className={cn(
                        'min-w-[1.75rem] rounded px-1.5 py-1 font-medium text-xs',
                        size === option
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                      onClick={() => onSizeChange(option)}
                      type="button"
                    >
                      {PREVIEW_SIZE_LABELS[option]}
                    </button>
                  </LayoutTooltip>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
