'use client';

import { useEffect, useState } from 'react';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * User settings page recipe mock with a short save / toggle loop.
 *
 * @returns Settings product UI for the zig-zag section.
 * @example
 * <UserSettingsMock />
 */
export const UserSettingsMock = () => {
  const reduced = useReducedMotion();
  const { messages } = useLandingLocale();
  const copy = messages.zigZag.settings;
  const [savedFlash, setSavedFlash] = useState(false);
  const [darkOn, setDarkOn] = useState(true);

  useEffect(() => {
    if (reduced) {
      return;
    }
    let clearFlash: ReturnType<typeof globalThis.setTimeout> | undefined;
    const loop = globalThis.setInterval(() => {
      setDarkOn((value) => !value);
      setSavedFlash(true);
      if (clearFlash !== undefined) {
        globalThis.clearTimeout(clearFlash);
      }
      clearFlash = globalThis.setTimeout(() => setSavedFlash(false), 1200);
    }, 3200);
    return () => {
      globalThis.clearInterval(loop);
      if (clearFlash !== undefined) {
        globalThis.clearTimeout(clearFlash);
      }
    };
  }, [reduced]);

  const nav = [copy.navProfile, copy.navSecurity, copy.navBilling, copy.navTeam] as const;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-border/70 border-b bg-muted/30 px-4 py-2.5">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[#ff5f57]" />
          <span className="size-2 rounded-full bg-[#febc2e]" />
          <span className="size-2 rounded-full bg-[#28c840]" />
        </span>
        <div className="min-w-0 flex-1 truncate rounded-md bg-background/80 px-2.5 py-1 text-center text-xs text-muted-foreground">
          app.yoursite.com/settings/profile
        </div>
      </div>

      <div className="flex min-h-[300px]">
        <aside className="hidden w-[120px] shrink-0 space-y-1 border-border/70 border-e bg-muted/20 p-3 sm:block">
          {nav.map((item, index) => (
            <div
              key={item}
              className={cn(
                'rounded-md px-2 py-1.5 text-xs',
                index === 0
                  ? 'bg-background font-medium text-blue-700 shadow-sm'
                  : 'text-muted-foreground',
              )}
            >
              {item}
            </div>
          ))}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 text-sm">
                AS
              </span>
              <div>
                <p className="font-semibold text-sm leading-tight">{copy.userName}</p>
                <p className="text-muted-foreground text-xs">{copy.userEmail}</p>
              </div>
            </div>
            <span
              className={cn(
                'rounded-full px-2 py-1 font-medium text-xs transition-all duration-300',
                savedFlash
                  ? 'bg-emerald-500/15 text-emerald-700 opacity-100'
                  : 'bg-muted text-muted-foreground opacity-70',
              )}
            >
              {savedFlash ? copy.saved : copy.readyBadge}
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="block">
              <span className="mb-1 block font-medium text-muted-foreground text-xs">
                {copy.nameLabel}
              </span>
              <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {copy.userName}
              </div>
            </div>
            <div className="block">
              <span className="mb-1 block font-medium text-muted-foreground text-xs">
                {copy.roleLabel}
              </span>
              <div className="rounded-lg border border-border bg-background px-3 py-2 text-muted-foreground text-sm">
                {copy.roleValue}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
            <div className="min-w-0 text-start">
              <p className="font-medium text-sm">{copy.darkMode}</p>
              <p className="text-muted-foreground text-xs">{copy.darkModeHint}</p>
            </div>
            {/*
              Force LTR on the switch so ON = knob on the physical right in every
              locale. RTL page direction was flipping translate-x and making the
              thumb sit on the wrong side of a blue track.
            */}
            <button
              aria-checked={darkOn}
              aria-label={copy.darkMode}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
                darkOn ? 'bg-blue-600' : 'bg-muted',
              )}
              dir="ltr"
              role="switch"
              type="button"
            >
              <span
                className={cn(
                  'absolute top-0.5 start-0.5 size-5 rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-300',
                  darkOn ? 'start-[1.375rem]' : 'start-0.5',
                )}
              />
            </button>
          </div>

          <div className="mt-auto">
            <div
              className={cn(
                'rounded-lg py-2.5 text-center font-medium text-sm text-white transition-colors duration-300',
                savedFlash ? 'bg-emerald-600' : 'bg-blue-600',
              )}
            >
              {savedFlash ? copy.saved : copy.saveCta}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
