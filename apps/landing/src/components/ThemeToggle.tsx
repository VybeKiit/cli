'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  readonly className?: string;
}

interface ViewTransitionDocument {
  readonly startViewTransition?: (updateCallback: () => void) => {
    readonly finished: Promise<void>;
  };
}

/**
 * Apply light/dark on the document root so View Transition snapshots capture
 * the new theme in the same frame as next-themes state.
 *
 * @param nextTheme - Theme to apply.
 * @param setTheme - next-themes setter (persists + syncs provider state).
 */
const commitTheme = (nextTheme: 'light' | 'dark', setTheme: (theme: string) => void): void => {
  const root = document.documentElement;
  flushSync(() => {
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = nextTheme;
  });
};

/**
 * Softly crossfade the whole page between light and dark via the View
 * Transitions API (fade out old → fade in new). Falls back to an instant
 * flip when reduced motion is on or the API is missing.
 *
 * @param nextTheme - Theme to apply.
 * @param setTheme - next-themes setter.
 * @param reduced - Whether motion should be reduced.
 */
const applyThemeWithFade = (
  nextTheme: 'light' | 'dark',
  setTheme: (theme: string) => void,
  reduced: boolean,
): void => {
  const doc = document as Document & ViewTransitionDocument;
  if (reduced || typeof doc.startViewTransition !== 'function') {
    commitTheme(nextTheme, setTheme);
    return;
  }

  const root = document.documentElement;
  root.dataset.themeVt = 'fade';
  const transition = doc.startViewTransition(() => {
    commitTheme(nextTheme, setTheme);
  });

  void transition.finished.finally(() => {
    delete root.dataset.themeVt;
  });
};

/**
 * Sun/moon control for light/dark. Page surfaces crossfade with a soft
 * fade-out / fade-in; icons swap with a short rotate + scale.
 *
 * @param props - Optional className.
 * @returns The theme toggle button.
 * @example
 * <ThemeToggle />
 */
export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  const onToggle = useCallback(() => {
    applyThemeWithFade(isDark ? 'light' : 'dark', setTheme, reduced);
  }, [isDark, reduced, setTheme]);

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
