import type { OperatorStepIcon } from '@/data/visitorLanding';
import { cn } from '@/lib/utils';

interface OperatorStepIllustrationProps {
  readonly icon: OperatorStepIcon;
  readonly featured?: boolean;
  readonly className?: string;
}

/**
 * Custom SVG scene for one Plan→Live operator step (not a generic lucide glyph).
 * Each scene includes continuous CSS loop animations via `.osi-*` classes.
 *
 * @param props - Step icon key and featured styling.
 * @returns Inline SVG illustration.
 */
export const OperatorStepIllustration = ({
  icon,
  featured = false,
  className,
}: OperatorStepIllustrationProps) => {
  const stroke = featured ? 'rgba(255,255,255,0.92)' : 'currentColor';
  const fillSoft = featured ? 'rgba(255,255,255,0.14)' : 'hsl(var(--muted))';
  const accent = featured ? '#93c5fd' : 'hsl(var(--blue, 221 83% 53%))';
  const ink = featured ? '#1e3a8a' : '#fff';

  return (
    <svg
      aria-hidden={true}
      className={cn('operator-step-illustration', className)}
      fill="none"
      viewBox="0 0 48 48"
    >
      {icon === 'plan' ? (
        <>
          {/* Blueprint page */}
          <rect
            fill={fillSoft}
            height="34"
            rx="4"
            stroke={stroke}
            strokeWidth="1.5"
            width="28"
            x="10"
            y="7"
          />
          <path
            className="osi-anim osi-plan-line-1"
            d="M16 15h16"
            stroke={stroke}
            strokeLinecap="round"
            strokeWidth="1.6"
          />
          <path
            className="osi-anim osi-plan-line-2"
            d="M16 21h12"
            stroke={stroke}
            strokeLinecap="round"
            strokeWidth="1.6"
          />
          <path
            className="osi-anim osi-plan-line-3"
            d="M16 27h14"
            stroke={stroke}
            strokeLinecap="round"
            strokeWidth="1.6"
          />
          {/* Cursor writing loop */}
          <g className="osi-anim osi-plan-cursor">
            <path d="M18 32l3-8 3 8-3-2z" fill={accent} stroke={stroke} strokeWidth="0.8" />
          </g>
          <g className="osi-anim osi-plan-badge">
            <circle cx="34" cy="34" fill={accent} r="7" />
            <path d="M31.5 34h5M34 31.5v5" stroke={ink} strokeLinecap="round" strokeWidth="1.5" />
          </g>
        </>
      ) : null}

      {icon === 'build' ? (
        <>
          {/* App window + devices stacking */}
          <rect
            className="osi-anim osi-build-web"
            fill={fillSoft}
            height="18"
            rx="3"
            stroke={stroke}
            strokeWidth="1.5"
            width="30"
            x="6"
            y="8"
          />
          <path
            className="osi-anim osi-build-code"
            d="M12 14l3 3-3 3M18 20h8"
            stroke={accent}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
          {/* Phone */}
          <rect
            className="osi-anim osi-build-phone"
            fill={fillSoft}
            height="16"
            rx="2.5"
            stroke={stroke}
            strokeWidth="1.4"
            width="10"
            x="28"
            y="18"
          />
          <rect fill={accent} height="1.5" opacity="0.7" rx="0.5" width="5" x="30.5" y="21" />
          {/* Extension popup */}
          <rect
            className="osi-anim osi-build-ext"
            fill={fillSoft}
            height="12"
            rx="2"
            stroke={stroke}
            strokeWidth="1.3"
            width="14"
            x="10"
            y="28"
          />
          <circle className="osi-anim osi-build-dot" cx="15" cy="34" fill={accent} r="1.6" />
          <path d="M18 33h4M18 36h3" stroke={stroke} strokeLinecap="round" strokeWidth="1.2" />
        </>
      ) : null}

      {icon === 'wire' ? (
        <>
          {/* Three service nodes with traveling packet */}
          <circle
            className="osi-anim osi-wire-node-a"
            cx="12"
            cy="14"
            fill={fillSoft}
            r="6"
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path d="M10 14h4M12 12v4" stroke={accent} strokeLinecap="round" strokeWidth="1.2" />
          <circle
            className="osi-anim osi-wire-node-b"
            cx="36"
            cy="14"
            fill={fillSoft}
            r="6"
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path d="M34 14h4" stroke={accent} strokeLinecap="round" strokeWidth="1.2" />
          <circle
            className="osi-anim osi-wire-node-c"
            cx="24"
            cy="34"
            fill={fillSoft}
            r="6"
            stroke={stroke}
            strokeWidth="1.5"
          />
          <rect fill={accent} height="3" opacity="0.85" rx="0.5" width="3" x="22.5" y="32.5" />
          <path
            className="osi-anim osi-wire-link"
            d="M18 14h12M16 18.5C18 24 20 28 24 28M32 18.5C30 24 28 28 24 28"
            stroke={accent}
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <circle className="osi-anim osi-wire-packet" cx="18" cy="14" fill={accent} r="2" />
        </>
      ) : null}

      {icon === 'verify' ? (
        <>
          <g className="osi-anim osi-verify-shield">
            <path
              d="M24 8l12 5v10c0 8-5.5 13.5-12 15.5C17.5 36.5 12 31 12 23V13l12-5z"
              fill={fillSoft}
              stroke={stroke}
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </g>
          <path
            className="osi-anim osi-verify-check"
            d="M18.5 24.5l4 4 7.5-8"
            stroke={accent}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          {/* Scan line across shield */}
          <path
            className="osi-anim osi-verify-scan"
            d="M15 22h18"
            stroke={accent}
            strokeLinecap="round"
            strokeWidth="1.2"
          />
        </>
      ) : null}

      {icon === 'live' ? (
        <>
          <g className="osi-anim osi-live-ship">
            <path
              d="M16 30c4-10 8-16 12-18 1.5 4 2 9 1.5 14L36 22l-2 8-8-1.5c-3 3.5-6 5-10 5.5z"
              fill={fillSoft}
              stroke={stroke}
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <circle className="osi-anim osi-live-star" cx="28" cy="18" fill={accent} r="2.2" />
          </g>
          <path
            d="M12 36h24"
            opacity="0.55"
            stroke={stroke}
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <path
            className="osi-anim osi-live-trail"
            d="M18 36c1.5-3 4-5 6-5s4.5 2 6 5"
            stroke={accent}
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          {/* Live pulse rings */}
          <circle
            className="osi-anim osi-live-ring"
            cx="24"
            cy="36"
            r="3"
            stroke={accent}
            strokeWidth="1.2"
          />
        </>
      ) : null}
    </svg>
  );
};
