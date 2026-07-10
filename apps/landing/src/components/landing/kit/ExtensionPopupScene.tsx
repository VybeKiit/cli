'use client';

import { Bookmark, Database, FileText, Languages, Puzzle, Reply, Search } from 'lucide-react';

import { cn } from '@/lib/utils';

const ACTIONS = [
  { label: 'Summarize page', icon: FileText },
  { label: 'Extract data', icon: Database },
  { label: 'Generate reply', icon: Reply },
  { label: 'Translate', icon: Languages },
] as const;

interface ExtensionPopupSceneProps {
  readonly className?: string;
  /** Compact layout for platform card hover previews. */
  readonly compact?: boolean;
  /** When true, plays the click → open loop. */
  readonly animated?: boolean;
}

/**
 * Browser chrome with a toolbar extension icon: cursor clicks it, popup opens.
 * Reads as a real Chrome extension interaction, not a full-page panel.
 *
 * @param props - Layout density and animation toggle.
 * @returns The rendered ExtensionPopupScene element.
 * @example
 * ```tsx
 * <ExtensionPopupScene animated compact={false} />
 * ```
 */
export const ExtensionPopupScene = ({
  className,
  compact = false,
  animated = true,
}: ExtensionPopupSceneProps) => (
  <div
    className={cn(
      'extension-scene',
      compact && 'extension-scene--compact',
      animated && 'extension-scene--animated',
      className,
    )}
  >
    {/* Browser chrome */}
    <div className="extension-scene__chrome">
      <span className="extension-scene__traffic">
        <span className="extension-scene__dot extension-scene__dot--red" />
        <span className="extension-scene__dot extension-scene__dot--yellow" />
        <span className="extension-scene__dot extension-scene__dot--green" />
      </span>
      <div className="extension-scene__url">
        <span className="extension-scene__lock" aria-hidden={true}>
          🔒
        </span>
        docs.yourproduct.com
      </div>
      <div className="extension-scene__toolbar" aria-hidden={true}>
        <span className="extension-scene__tool-icon">
          <Puzzle className="size-full" strokeWidth={1.8} />
        </span>
        <span className="extension-scene__tool-icon extension-scene__tool-icon--active">
          <span className="extension-scene__brand-mark">
            <span className="extension-scene__brand-core" />
          </span>
          <span className="extension-scene__tool-ping" />
        </span>
      </div>
    </div>

    {/* Page under the popup */}
    <div className="extension-scene__page">
      <div className="extension-scene__page-line extension-scene__page-line--title" />
      <div className="extension-scene__page-line" />
      <div className="extension-scene__page-line extension-scene__page-line--short" />
      <div className="extension-scene__page-block" />
      <div className="extension-scene__page-line" />
      <div className="extension-scene__page-line extension-scene__page-line--mid" />
    </div>

    {/* Cursor that “clicks” the extension icon */}
    <div aria-hidden={true} className="extension-scene__cursor">
      <svg
        aria-hidden={true}
        className="extension-scene__cursor-svg"
        fill="none"
        focusable="false"
        viewBox="0 0 24 28"
      >
        <title>Cursor</title>
        <path
          d="M4 2.5 4 22.5 9.2 17.8 12.4 25.2 15.1 24 11.8 16.4 18.5 16.2 4 2.5Z"
          fill="#0f172a"
          stroke="#fff"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </svg>
      <span className="extension-scene__click-ripple" />
    </div>

    {/* Extension popup anchored under the toolbar icon */}
    <div className="extension-scene__popup">
      <div className="extension-scene__popup-caret" aria-hidden={true} />
      <div className="extension-scene__popup-inner">
        <div className="extension-scene__popup-header">
          <div className="extension-scene__popup-brand">
            <span className="extension-scene__brand-mark extension-scene__brand-mark--lg">
              <span className="extension-scene__brand-core" />
            </span>
            <div>
              <p className="extension-scene__popup-title">VybeKiit</p>
              {compact ? null : (
                <p className="extension-scene__popup-sub">Assistant on this page</p>
              )}
            </div>
          </div>
          <Bookmark className="extension-scene__popup-bookmark" strokeWidth={1.8} />
        </div>

        <div className="extension-scene__popup-search">
          <Search className="extension-scene__popup-search-icon" strokeWidth={2} />
          Ask anything...
        </div>

        <ul className="extension-scene__popup-actions">
          {ACTIONS.map((action) => (
            <li className="extension-scene__popup-action" key={action.label}>
              <span className="extension-scene__popup-action-icon">
                <action.icon className="size-full" strokeWidth={1.8} />
              </span>
              {action.label}
            </li>
          ))}
        </ul>

        <div className="extension-scene__popup-footer">
          <span className="extension-scene__live-dot" />
          Your app is live
        </div>
      </div>
    </div>
  </div>
);
