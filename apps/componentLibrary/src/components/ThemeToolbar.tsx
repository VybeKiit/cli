'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { usePreviewTheme } from '@library/components/PreviewThemeProvider';
import { DEFAULT_PRIMARY, PRESET_PRIMARIES, type PreviewMode } from '@library/lib/theme';
import { Moon, RotateCcw, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

function isSelected(primary: string, hex: string): boolean {
  return primary.toLowerCase() === hex.toLowerCase();
}

/** Preset swatches + custom color input + reset — writes the shared global primary. */
export function PrimaryPicker() {
  const { primary, setPrimary, resetPrimary } = usePreviewTheme();

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground text-xs">Primary</span>
      {PRESET_PRIMARIES.map((preset) => (
        <LayoutTooltip
          key={preset.hex}
          label={`Set the gallery accent to ${preset.name}. Previews inherit this brand color.`}
        >
          <button
            aria-label={preset.name}
            aria-pressed={isSelected(primary, preset.hex)}
            className={`size-5 rounded-full border border-border/60 ${
              isSelected(primary, preset.hex)
                ? 'ring-2 ring-ring ring-offset-1 ring-offset-background'
                : ''
            }`}
            onClick={() => setPrimary(preset.hex)}
            style={{ backgroundColor: preset.hex }}
            type="button"
          />
        </LayoutTooltip>
      ))}
      <LayoutTooltip label="Pick a custom accent color for all live previews.">
        <label className="relative size-5 cursor-pointer rounded-full border border-border/60">
          <input
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(event) => setPrimary(event.target.value)}
            type="color"
            value={primary}
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] leading-none">
            +
          </span>
        </label>
      </LayoutTooltip>
      {primary.toLowerCase() === DEFAULT_PRIMARY ? null : (
        <LayoutTooltip label="Reset the accent color to the VybeKiit default.">
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={resetPrimary}
            type="button"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </LayoutTooltip>
      )}
    </div>
  );
}

const PREVIEW_MODE_TIPS: Record<PreviewMode, string> = {
  light: 'Preview this component on a light background.',
  dark: 'Preview this component on a dark background.',
};

/** Segmented light/dark control for a single preview (independent of the chrome theme). */
export function PreviewModeToggle({
  mode,
  onChange,
}: {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      {(['light', 'dark'] as const).map((option) => (
        <LayoutTooltip key={option} label={PREVIEW_MODE_TIPS[option]}>
          <button
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
              mode === option
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => onChange(option)}
            type="button"
          >
            {option === 'light' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            <span className="capitalize">{option}</span>
          </button>
        </LayoutTooltip>
      ))}
    </div>
  );
}

/** Global controls for the catalog chrome: light/dark (next-themes) + the shared primary. */
export function GlobalThemeControls() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) {
    // next-themes has no server value — reserve height to avoid a layout jump on hydrate.
    return <div aria-hidden="true" className="h-8" />;
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LayoutTooltip label="Switch the gallery chrome between light and dark mode. Component previews follow unless you override them on the detail page.">
        <button
          className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          type="button"
        >
          {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          {isDark ? 'Light' : 'Dark'}
        </button>
      </LayoutTooltip>
      <PrimaryPicker />
    </div>
  );
}
