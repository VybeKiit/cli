import type { ReportDockAnchor, ReportHandoffTarget } from '@vybekiit/report-mode';
import { cn } from '@/lib/utils';
import type { CSSProperties, HTMLAttributes, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;
type BrandIconProps = HTMLAttributes<HTMLSpanElement>;

const VYBEKIIT_MARK_MASK = 'url("/vybekiit-logo.svg") center / contain no-repeat';

/**
 * Render the drag-grip icon for moving the dock.
 *
 * @param props - SVG props forwarded to the icon element.
 * @returns Drag icon SVG.
 * @example
 * <ReportDragIcon />
 */
const ReportDragIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={cn('report-mode-icon report-mode-icon--drag', className)}
    fill="currentColor"
    viewBox="0 0 16 16"
    {...props}
  >
    {[
      [4, 3],
      [8, 3],
      [12, 3],
      [4, 8],
      [8, 8],
      [12, 8],
      [4, 13],
      [8, 13],
      [12, 13],
    ].map(([cx, cy]) => (
      <circle cx={cx} cy={cy} key={`${cx}-${cy}`} r="1.1" />
    ))}
  </svg>
);

type ReportTargetIconProps = IconProps & {
  readonly active?: boolean;
};

/**
 * Render the crosshair target icon for inspect mode.
 *
 * @param props - SVG props plus active state.
 * @returns Target icon SVG.
 * @example
 * <ReportTargetIcon active={true} />
 */
const ReportTargetIcon = ({ active = false, className, ...props }: ReportTargetIconProps) => (
  <svg
    aria-hidden="true"
    className={cn(
      'report-mode-icon report-mode-icon--report',
      active && 'report-mode-icon--report-active',
      className,
    )}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <circle
      className="report-mode-icon-ring"
      cx="12"
      cy="12"
      r="8.5"
      stroke="currentColor"
      strokeDasharray="3 2.5"
      strokeWidth="1.4"
    />
    <path
      className="report-mode-icon-bracket"
      d="M5 8 V5 H8 M16 5 H19 V8 M19 16 V19 H16 M8 19 H5 V16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
    <line
      className="report-mode-icon-crosshair-v"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.4"
      x1="12"
      x2="12"
      y1="3.5"
      y2="8.5"
    />
    <line
      className="report-mode-icon-crosshair-v"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.4"
      x1="12"
      x2="12"
      y1="15.5"
      y2="20.5"
    />
    <line
      className="report-mode-icon-crosshair-h"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.4"
      x1="3.5"
      x2="8.5"
      y1="12"
      y2="12"
    />
    <line
      className="report-mode-icon-crosshair-h"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.4"
      x1="15.5"
      x2="20.5"
      y1="12"
      y2="12"
    />
    <circle className="report-mode-icon-dot" cx="12" cy="12" fill="currentColor" r="1.8" />
  </svg>
);

/**
 * Render the map-pin icon for the position control.
 *
 * @param props - SVG props forwarded to the icon element.
 * @returns Pin icon SVG.
 * @example
 * <ReportPinIcon />
 */
const ReportPinIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={cn('report-mode-icon report-mode-icon--pin', className)}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      d="M12 21 C12 21 5 14.2 5 9.5 A7 7 0 1 1 19 9.5 C19 14.2 12 21 12 21 Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
    <circle cx="12" cy="9.5" fill="currentColor" r="2.2" />
    <path
      className="report-mode-icon-pin-shine"
      d="M9.5 7.5 C10.2 6.4 11 6 12 6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.2"
    />
  </svg>
);

type ReportChatIconProps = IconProps & {
  readonly target: ReportHandoffTarget;
};

/**
 * Render the chat handoff icon for current-chat or new-chat targets.
 *
 * @param props - SVG props plus the handoff target.
 * @returns Chat handoff icon SVG.
 * @example
 * <ReportChatHandoffIcon target="current-chat" />
 */
const ReportChatHandoffIcon = ({ target, className, ...props }: ReportChatIconProps) => {
  const isNew = target === 'new-chat';

  return (
    <svg
      aria-hidden="true"
      className={cn(
        'report-mode-icon report-mode-icon--chat',
        isNew ? 'report-mode-icon--chat-new' : 'report-mode-icon--chat-current',
        className,
      )}
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        d="M5 6.5 H19 A2.5 2.5 0 0 1 21.5 9 V14 A2.5 2.5 0 0 1 19 16.5 H10 L6 19.5 V16.5 H5 A2.5 2.5 0 0 1 2.5 14 V9 A2.5 2.5 0 0 1 5 6.5 Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      {isNew ? (
        <>
          <path
            className="report-mode-icon-chat-spark"
            d="M12 9.5 V14.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
          <path
            className="report-mode-icon-chat-spark"
            d="M9.5 12 H14.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.6"
          />
          <circle
            className="report-mode-icon-chat-star"
            cx="17.5"
            cy="7"
            fill="currentColor"
            r="0.9"
          />
        </>
      ) : (
        <>
          <line
            className="report-mode-icon-chat-line"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.4"
            x1="7.5"
            x2="16.5"
            y1="10.5"
            y2="10.5"
          />
          <line
            className="report-mode-icon-chat-line"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.4"
            x1="7.5"
            x2="13.5"
            y1="13.5"
            y2="13.5"
          />
        </>
      )}
    </svg>
  );
};

type CornerAnchorIconProps = IconProps & {
  readonly corner: Exclude<ReportDockAnchor, 'custom'>;
  readonly beaming?: boolean;
};

/**
 * Render the corner anchor icon used by the pin menu.
 *
 * @param props - SVG props plus target corner and optional beam state.
 * @returns Corner anchor SVG.
 * @example
 * <CornerAnchorIcon corner="bottom-right" />
 */
const CornerAnchorIcon = ({
  beaming = false,
  corner,
  className,
  ...props
}: CornerAnchorIconProps) => {
  const dot = {
    'top-left': { cx: 5, cy: 5 },
    'top-right': { cx: 15, cy: 5 },
    'bottom-left': { cx: 5, cy: 15 },
    'bottom-right': { cx: 15, cy: 15 },
  }[corner];
  const beamId = `report-corner-beam-${corner}`;

  return (
    <svg
      aria-hidden="true"
      className={cn(
        'report-mode-icon report-mode-icon--corner',
        beaming && 'report-mode-icon--corner-beam',
        className,
      )}
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      {beaming ? (
        <defs>
          <radialGradient id={beamId}>
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
      ) : null}
      {beaming ? (
        <circle
          className="report-mode-icon-corner-beam"
          cx={dot.cx}
          cy={dot.cy}
          fill={`url(#${beamId})`}
          r="4.5"
        />
      ) : null}
      <rect height="14" rx="2" stroke="currentColor" strokeWidth="1.4" width="14" x="3" y="3" />
      <circle
        className="report-mode-icon-corner-dot"
        cx={dot.cx}
        cy={dot.cy}
        fill="currentColor"
        r="2.6"
      />
    </svg>
  );
};

/**
 * Render the brand-chip expand/collapse chevron.
 *
 * @param props - SVG props plus chevron direction.
 * @returns Chevron icon SVG.
 * @example
 * <ReportBrandChevronIcon direction="left" />
 */
const ReportBrandChevronIcon = ({
  className,
  direction,
  ...props
}: IconProps & { readonly direction: 'left' | 'right' }) => (
  <svg
    aria-hidden="true"
    className={cn('report-mode-brand-chevron', className)}
    fill="none"
    viewBox="0 0 12 12"
    {...props}
  >
    {direction === 'left' ? (
      <path
        d="M7.5 2.5 L4 6 L7.5 9.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    ) : (
      <path
        d="M4.5 2.5 L8 6 L4.5 9.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    )}
  </svg>
);

/**
 * Render the note-panel send icon.
 *
 * @param props - SVG props forwarded to the icon element.
 * @returns Send icon SVG.
 * @example
 * <ReportSendIcon />
 */
const ReportSendIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={cn('report-mode-icon report-mode-icon--send', className)}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      className="report-mode-icon-send-body"
      d="M4 12 L20 5 L13 20 L11 13 Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
    <path
      className="report-mode-icon-send-fold"
      d="M11 13 L20 5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  </svg>
);

/**
 * Render the note-panel cancel icon.
 *
 * @param props - SVG props forwarded to the icon element.
 * @returns Cancel icon SVG.
 * @example
 * <ReportCancelIcon />
 */
const ReportCancelIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={cn('report-mode-icon report-mode-icon--cancel', className)}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      className="report-mode-icon-cancel-line"
      d="M8 8 L16 16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
    <path
      className="report-mode-icon-cancel-line"
      d="M16 8 L8 16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * Render the note-panel copy icon.
 *
 * @param props - SVG props forwarded to the icon element.
 * @returns Copy icon SVG.
 * @example
 * <ReportCopyIcon />
 */
const ReportCopyIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={cn('report-mode-icon report-mode-icon--copy', className)}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <rect
      className="report-mode-icon-copy-board"
      height="12"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.5"
      width="10"
      x="8"
      y="8"
    />
    <path
      className="report-mode-icon-copy-clip"
      d="M6 8 V6 A2 2 0 0 1 8 4 H14 A2 2 0 0 1 16 6 V8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.5"
    />
    <path
      className="report-mode-icon-copy-check"
      d="M10 13 L11.5 14.5 L14.5 11.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.4"
    />
  </svg>
);

/**
 * Render the compact VybeKiit mark for the dock chip.
 *
 * @param props - Span props forwarded to the icon element.
 * @returns VybeKiit mark element.
 * @example
 * <ReportVybeMarkIcon />
 */
const ReportVybeMarkIcon = ({ className, style, ...props }: BrandIconProps) => {
  const maskStyle: CSSProperties = {
    WebkitMask: VYBEKIIT_MARK_MASK,
    backgroundColor: 'currentColor',
    height: '0.95rem',
    mask: VYBEKIIT_MARK_MASK,
    width: '0.95rem',
    ...style,
  };

  return (
    <span
      aria-hidden="true"
      className={cn('report-mode-icon report-mode-icon--vybe', className)}
      style={maskStyle}
      {...props}
    />
  );
};

export {
  CornerAnchorIcon,
  ReportBrandChevronIcon,
  ReportCancelIcon,
  ReportChatHandoffIcon,
  ReportCopyIcon,
  ReportDragIcon,
  ReportPinIcon,
  ReportSendIcon,
  ReportTargetIcon,
  ReportVybeMarkIcon,
};
