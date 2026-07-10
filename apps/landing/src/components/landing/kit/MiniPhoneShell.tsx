import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface MiniPhoneShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Realistic iPhone chassis for product previews: titanium rim, side buttons,
 * Dynamic Island with dual lenses, glass sheen, and home indicator.
 *
 * @param props - Screen content and optional size classes.
 * @returns The rendered MiniPhoneShell element.
 * @example
 * ```tsx
 * <MiniPhoneShell className="w-[168px]">
 *   <DashboardPreview />
 * </MiniPhoneShell>
 * ```
 */
export const MiniPhoneShell = ({ children, className }: MiniPhoneShellProps) => (
  <div className={cn('mini-iphone', className)} data-device="iphone">
    {/* Physical side controls (outside the rounded glass) */}
    <span aria-hidden={true} className="mini-iphone__btn mini-iphone__btn--silent" />
    <span aria-hidden={true} className="mini-iphone__btn mini-iphone__btn--vol-up" />
    <span aria-hidden={true} className="mini-iphone__btn mini-iphone__btn--vol-down" />
    <span aria-hidden={true} className="mini-iphone__btn mini-iphone__btn--power" />

    <div className="mini-iphone__body">
      {/* Outer titanium frame + specular edge */}
      <div className="mini-iphone__titanium" aria-hidden={true} />
      <div className="mini-iphone__inner-bezel">
        <div className="mini-iphone__screen">
          {/* Dynamic Island */}
          <div aria-hidden={true} className="mini-iphone__island">
            <span className="mini-iphone__island-lens mini-iphone__island-lens--main" />
            <span className="mini-iphone__island-lens mini-iphone__island-lens--ultra" />
            <span className="mini-iphone__island-mic" />
          </div>

          {/* Status bar strip (time / signal) so content sits under a real phone UI */}
          <div aria-hidden={true} className="mini-iphone__status">
            <span className="mini-iphone__status-time">9:41</span>
            <span className="mini-iphone__status-icons">
              <svg
                aria-hidden={true}
                className="mini-iphone__status-signal"
                fill="currentColor"
                focusable="false"
                viewBox="0 0 18 12"
              >
                <title>Signal</title>
                <rect height="4" opacity="0.35" rx="0.6" width="2.2" x="0" y="8" />
                <rect height="6" opacity="0.55" rx="0.6" width="2.2" x="3.8" y="6" />
                <rect height="8" opacity="0.75" rx="0.6" width="2.2" x="7.6" y="4" />
                <rect height="10" rx="0.6" width="2.2" x="11.4" y="2" />
              </svg>
              <svg
                aria-hidden={true}
                className="mini-iphone__status-wifi"
                fill="currentColor"
                focusable="false"
                viewBox="0 0 16 12"
              >
                <title>Wi-Fi</title>
                <path d="M8 10.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z" />
                <path
                  d="M4.2 7.6a5.4 5.4 0 0 1 7.6 0"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.4"
                />
                <path
                  d="M1.8 5a8.8 8.8 0 0 1 12.4 0"
                  fill="none"
                  opacity="0.55"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.4"
                />
              </svg>
              <span className="mini-iphone__status-battery">
                <span className="mini-iphone__status-battery-level" />
              </span>
            </span>
          </div>

          <div className="mini-iphone__content">{children}</div>

          <div aria-hidden={true} className="mini-iphone__home" />

          {/* Glass reflection */}
          <div aria-hidden={true} className="mini-iphone__glass" />
        </div>
      </div>
    </div>
  </div>
);
