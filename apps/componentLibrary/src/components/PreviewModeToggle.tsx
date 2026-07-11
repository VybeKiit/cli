'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import type { PreviewMode } from '@library/lib/theme';
import { Moon, Sun } from 'lucide-react';

const PREVIEW_MODE_TIPS: Readonly<Record<PreviewMode, string>> = {
  light: 'Preview this component on a light background.',
  dark: 'Preview this component on a dark background.',
};

interface PreviewModeToggleProps {
  readonly mode: PreviewMode;
  readonly onChange: (mode: PreviewMode) => void;
}

/**
 * Per-preview light/dark segmented control.
 *
 * @param props - Current preview mode and change handler.
 * @returns A React element for switching one preview independently of chrome theme.
 * @example
 * const element = <PreviewModeToggle mode="light" onChange={setMode} />;
 */
export const PreviewModeToggle = ({ mode, onChange }: PreviewModeToggleProps) => (
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
