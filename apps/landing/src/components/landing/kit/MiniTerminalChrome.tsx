import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type TerminalChromeVariant = 'macos' | 'windows';

interface MiniTerminalChromeProps {
  readonly children: ReactNode;
  readonly className?: string;
  /** Centered (macOS) or leading (Windows) title-bar label. */
  readonly title?: string;
  /** Chrome style — macOS traffic lights or Windows window controls. */
  readonly variant?: TerminalChromeVariant;
  /** Fired when the close control is clicked (decorative easter egg). */
  readonly onCloseClick?: () => void;
}

const CLOSE_ICON = (
  <svg aria-hidden={true} className="ghostty-terminal__light-icon" viewBox="0 0 12 12">
    <path
      d="M3.6 3.6 8.4 8.4M8.4 3.6 3.6 8.4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.35"
    />
  </svg>
);

/** Compact terminal chrome that can render as macOS (Ghostty) or Windows Terminal. */
export function MiniTerminalChrome({
  children,
  className,
  title = 'ghostty — zsh',
  variant = 'macos',
  onCloseClick,
}: MiniTerminalChromeProps) {
  const CloseControl = onCloseClick ? 'button' : 'span';
  const closeProps = onCloseClick
    ? { type: 'button' as const, onClick: onCloseClick, 'aria-label': 'Close terminal' }
    : {};

  return (
    <div className={cn('ghostty-terminal', `ghostty-terminal--${variant}`, className)}>
      {/* key swaps the chrome so each variant change fades in */}
      <div className="ghostty-terminal__titlebar" data-variant={variant} key={variant}>
        {variant === 'windows' ? (
          <>
            <span
              aria-hidden={true}
              className="ghostty-terminal__title ghostty-terminal__title--lead"
            >
              {title}
            </span>
            <span className="ghostty-terminal__winctls">
              <span className="ghostty-terminal__winctl ghostty-terminal__winctl--minimize">
                <svg
                  aria-hidden={true}
                  className="ghostty-terminal__winctl-icon"
                  viewBox="0 0 12 12"
                >
                  <path d="M2.5 6.5h7" fill="none" stroke="currentColor" strokeWidth="1" />
                </svg>
              </span>
              <span className="ghostty-terminal__winctl ghostty-terminal__winctl--maximize">
                <svg
                  aria-hidden={true}
                  className="ghostty-terminal__winctl-icon"
                  viewBox="0 0 12 12"
                >
                  <rect
                    fill="none"
                    height="6.5"
                    rx="0.5"
                    stroke="currentColor"
                    strokeWidth="1"
                    width="6.5"
                    x="2.75"
                    y="2.75"
                  />
                </svg>
              </span>
              <CloseControl
                className="ghostty-terminal__winctl ghostty-terminal__winctl--close"
                {...closeProps}
              >
                <svg
                  aria-hidden={true}
                  className="ghostty-terminal__winctl-icon"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M3.2 3.2 8.8 8.8M8.8 3.2 3.2 8.8"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1"
                  />
                </svg>
              </CloseControl>
            </span>
          </>
        ) : (
          <>
            <span className="ghostty-terminal__lights">
              <CloseControl
                className="ghostty-terminal__light ghostty-terminal__light--close"
                {...closeProps}
              >
                {CLOSE_ICON}
              </CloseControl>
              <span className="ghostty-terminal__light ghostty-terminal__light--minimize">
                <svg
                  aria-hidden={true}
                  className="ghostty-terminal__light-icon"
                  viewBox="0 0 12 12"
                >
                  <rect fill="currentColor" height="1.5" rx="0.75" width="7" x="2.5" y="5.25" />
                </svg>
              </span>
              <span className="ghostty-terminal__light ghostty-terminal__light--maximize">
                <svg
                  aria-hidden={true}
                  className="ghostty-terminal__light-icon"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M7 2.5h2.5V5M5 9.5H2.5V7"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.25"
                  />
                </svg>
              </span>
            </span>
            <span aria-hidden={true} className="ghostty-terminal__title">
              {title}
            </span>
            <span aria-hidden={true} className="ghostty-terminal__titlebar-spacer" />
          </>
        )}
      </div>
      <div className="ghostty-terminal__body">{children}</div>
    </div>
  );
}
