'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { PrimaryPicker } from '@library/components/PrimaryPicker';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Global catalog chrome theme controls (light/dark + primary picker).
 *
 * @returns A React element for toggling chrome theme and global primary color.
 * @example
 * const element = <GlobalThemeControls />;
 */
export const GlobalThemeControls = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) {
    // next-themes has no server value, so reserve height to avoid a hydration jump.
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
};
