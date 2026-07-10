'use client';

import { Languages } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { LANDING_LOCALES } from '@/i18n/locales';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  readonly className?: string;
}

/**
 * Hover/focus language control for the store header. Expands a panel of
 * English, Hebrew, Russian, and Arabic; selection updates the whole landing copy.
 *
 * @param props - Optional className.
 * @returns Language hover button + menu.
 * @example
 * <LanguageToggle />
 */
export const LanguageToggle = ({ className }: LanguageToggleProps) => {
  const { locale, setLocale, messages } = useLandingLocale();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();
  const active = LANDING_LOCALES.find((entry) => entry.id === locale) ?? LANDING_LOCALES[0];

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 140);
  }, [clearCloseTimer]);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [clearCloseTimer],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className={cn('relative', className)} onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
      <Button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={messages.meta.switchLanguage}
        className="language-toggle-btn rounded-full px-2.5"
        onClick={() => setOpen((value) => !value)}
        onFocus={openMenu}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Languages aria-hidden={true} className="size-4 shrink-0" />
        <span className="font-medium text-xs tracking-wide">{active.shortLabel}</span>
      </Button>

      <div
        className={cn(
          'language-menu absolute end-0 top-full z-50 pt-2 transition-[opacity,transform]',
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-1 opacity-0',
        )}
        id={menuId}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <div
          aria-label={messages.meta.switchLanguage}
          className="min-w-[10.5rem] overflow-hidden rounded-xl border border-border/80 bg-popover p-1 shadow-lg"
          role="menu"
        >
          {LANDING_LOCALES.map((entry) => {
            const selected = entry.id === locale;
            return (
              <button
                key={entry.id}
                aria-current={selected ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm transition-colors',
                  selected
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-foreground hover:bg-muted',
                )}
                onClick={() => {
                  setLocale(entry.id);
                  setOpen(false);
                }}
                role="menuitem"
                type="button"
              >
                <span>{entry.nativeLabel}</span>
                <span className="text-muted-foreground text-xs tracking-wide">
                  {entry.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
