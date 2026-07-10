'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  readonly className?: string;
}

/**
 * Sun/moon control for light/dark. Theme flips instantly via `html.dark`
 * (CSS variables); only the icons animate. Full-page View Transitions and
 * surface color transitions are intentionally avoided — they block the main
 * thread on large marketing pages.
 *
 * @param props - Optional className.
 * @returns The theme toggle button.
 * @example
 * <ThemeToggle />
 */
export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const onToggle = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  if (!mounted) {
    return (
      <Button
        aria-hidden={true}
        className={cn('theme-toggle-btn rounded-full', className)}
        disabled={true}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <span className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn('theme-toggle-btn rounded-full', className)}
      onClick={onToggle}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      <span className="theme-toggle-icon-wrap relative size-4">
        <SunIcon
          aria-hidden={true}
          className={cn(
            'theme-toggle-icon absolute inset-0 size-4',
            isDark ? 'theme-toggle-icon--in' : 'theme-toggle-icon--out',
          )}
        />
        <MoonIcon
          aria-hidden={true}
          className={cn(
            'theme-toggle-icon absolute inset-0 size-4',
            isDark ? 'theme-toggle-icon--out' : 'theme-toggle-icon--in',
          )}
        />
      </span>
    </Button>
  );
};
