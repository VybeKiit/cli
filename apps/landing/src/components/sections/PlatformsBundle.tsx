'use client';

import type { ReactNode } from 'react';

import { ExtensionPopupScene } from '@/components/landing/kit/ExtensionPopupScene';
import { MiniBrowserChrome } from '@/components/landing/kit/MiniBrowserChrome';
import { MiniPhoneShell } from '@/components/landing/kit/MiniPhoneShell';
import { Sparkline } from '@/components/landing/kit/Sparkline';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { useLandingLocale } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

interface PlatformCardProps {
  readonly label: string;
  readonly idle: ReactNode;
  readonly preview: ReactNode;
  readonly stageClassName?: string;
}

/**
 * One platform column: product UI by default, brand logos on hover.
 *
 * @param props - Label, logo stack (hover), and product preview (default).
 * @returns The rendered platform card.
 */
const PlatformCard = ({ label, idle, preview, stageClassName }: PlatformCardProps) => (
  <div className="platform-card group">
    <div className={cn('platform-card-stage', stageClassName)}>
      <div className="platform-card-idle" aria-hidden={true}>
        {idle}
      </div>
      <div className="platform-card-preview">{preview}</div>
    </div>
    <p className="font-medium text-sm">{label}</p>
  </div>
);

/**
 * Web / mobile / extension product shots under one purchase heading.
 * Desktop: product mockups by default; hover reveals brand logo stack.
 * Mobile / touch: mockups stay visible (no hover).
 *
 * @returns The rendered platforms bundle section.
 * @example
 * <PlatformsBundle />
 */
export const PlatformsBundle = () => {
  const { messages } = useLandingLocale();
  const platforms = messages.platforms;

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-bold text-3xl tracking-tight">{platforms.heading}</h2>
        <p className="mt-2 text-muted-foreground">{platforms.subhead}</p>
      </div>
      <div className="mt-12 grid items-end gap-8 md:grid-cols-3">
        <PlatformCard
          label={platforms.web}
          idle={
            <div className="platform-idle-stack flex-col">
              <LogoMarkIcon className="platform-idle-logo size-14" slug="nextdotjs" />
              <LogoMarkIcon className="platform-idle-logo size-11" slug="vercel" />
              <LogoMarkIcon className="platform-idle-logo size-10" slug="react" />
            </div>
          }
          preview={
            <MiniBrowserChrome
              className="w-full max-w-[280px] shadow-md"
              dark={false}
              url="app.yourapp.com"
            >
              <div className="space-y-3 bg-background p-4">
                <p className="font-semibold text-xs">{platforms.mockOverview}</p>
                <p className="font-bold text-2xl tracking-tight">$2,841</p>
                <p className="text-xs text-emerald-600">{platforms.mockRevenueDelta}</p>
                <Sparkline className="h-16 w-full" id="platform-web-spark" />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-md border border-border bg-muted/40 p-2">
                    <p className="text-xs text-muted-foreground">{platforms.mockTransactions}</p>
                    <p className="font-semibold text-sm">128</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/40 p-2">
                    <p className="text-xs text-muted-foreground">{platforms.mockCustomers}</p>
                    <p className="font-semibold text-sm">84</p>
                  </div>
                </div>
              </div>
            </MiniBrowserChrome>
          }
        />

        <PlatformCard
          label={platforms.mobile}
          idle={
            <div className="platform-idle-stack">
              <LogoMarkIcon className="platform-idle-logo size-12" slug="appstore" />
              <LogoMarkIcon className="platform-idle-logo size-12" slug="googleplay" />
              <LogoMarkIcon className="platform-idle-logo size-11" slug="expo" />
            </div>
          }
          preview={
            <MiniPhoneShell className="w-[148px] max-w-none">
              <div className="space-y-2.5 px-3 pb-1">
                <p className="font-semibold text-white text-xs">{platforms.mockOverview}</p>
                <p className="font-bold text-2xl text-white tracking-tight">$2,841</p>
                <p className="text-xs text-emerald-400">+27.4%</p>
                <Sparkline className="h-12 w-full" id="platform-mobile-spark" />
                <div className="rounded-lg bg-white/5 p-2">
                  <p className="text-xs text-white/50">{platforms.mockTransactions}</p>
                  <p className="font-semibold text-sm text-white">128</p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-md bg-white/5 p-1.5">
                    <p className="text-xs text-white/45">{platforms.mockActive}</p>
                    <p className="font-semibold text-white text-xs">84</p>
                  </div>
                  <div className="rounded-md bg-white/5 p-1.5">
                    <p className="text-xs text-white/45">{platforms.mockRefunds}</p>
                    <p className="font-semibold text-white text-xs">2</p>
                  </div>
                </div>
              </div>
            </MiniPhoneShell>
          }
        />

        <PlatformCard
          label={platforms.extension}
          idle={
            <div className="platform-idle-stack flex-col">
              <LogoMarkIcon className="platform-idle-logo size-14" slug="googlechrome" />
              <LogoMarkIcon className="platform-idle-logo size-10" slug="wxt" />
            </div>
          }
          preview={
            <ExtensionPopupScene animated={true} compact={true} className="w-full max-w-[248px]" />
          }
        />
      </div>
    </section>
  );
};
