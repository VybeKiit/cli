import type { CSSProperties, HTMLAttributes, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;
type BrandIconProps = HTMLAttributes<HTMLSpanElement>;

const VYBEKIIT_MARK_MASK = 'url("/vybekiit-logo.svg") center / contain no-repeat';

const VybeMarkMask = ({ className, style, ...props }: BrandIconProps) => {
  const maskStyle: CSSProperties = {
    WebkitMask: VYBEKIIT_MARK_MASK,
    mask: VYBEKIIT_MARK_MASK,
    ...style,
  };

  return (
    <span
      aria-hidden="true"
      className={['inline-block shrink-0 bg-current', className].filter(Boolean).join(' ')}
      style={maskStyle}
      {...props}
    />
  );
};

/**
 * Stacked chevron VybeKiit logo mark.
 *
 * @param props - Component props.
 * @returns The rendered VybeLogoIcon element.
 * @example
 * ```tsx
 * <VybeLogoIcon />
 * ```
 */

export const VybeLogoIcon = (props: BrandIconProps) => <VybeMarkMask {...props} />;

/**
 * Compact brand mark for footer and tight UI slots.
 *
 * @param props - Component props.
 * @returns The rendered VybeBrandMark element.
 * @example
 * ```tsx
 * <VybeBrandMark />
 * ```
 */

export const VybeBrandMark = (props: BrandIconProps) => <VybeMarkMask {...props} />;

/**
 * Two agent nodes linked by a swap cycle — the "switch agent" control mark.
 *
 * @param props - Component props.
 * @returns The rendered SwitchAgentIcon element.
 * @example
 * ```tsx
 * <SwitchAgentIcon />
 * ```
 */

export const SwitchAgentIcon = ({ className, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17" cy="17" r="3" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M14 7 H17.5 A2.5 2.5 0 0 1 20 9.5 M17 6 L18 7 L17 8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M10 17 H6.5 A2.5 2.5 0 0 1 4 14.5 M7 18 L6 17 L7 16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * Hexagon badge with star — AI Operator feature icon.
 *
 * @param props - Component props.
 * @returns The rendered AIOperatorIcon element.
 * @example
 * ```tsx
 * <AIOperatorIcon />
 * ```
 */

export const AIOperatorIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    <path
      d="M12 2.5 L19 6.5 V17.5 L12 21.5 L5 17.5 V6.5 Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.45"
    />
    <path
      d="M12 7.5 L13.4 11 H17 L14.3 13.2 L15.4 17 L12 14.8 L8.6 17 L9.7 13.2 L7 11 H10.6 Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.45"
    />
  </svg>
);

/**
 * Browser window — Web App feature icon.
 *
 * @param props - Component props.
 * @returns The rendered WebAppIcon element.
 * @example
 * ```tsx
 * <WebAppIcon />
 * ```
 */

export const WebAppIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    <rect height="16" rx="2" stroke="currentColor" strokeWidth="1.45" width="20" x="2" y="4" />
    <path d="M2 8 H22" stroke="currentColor" strokeWidth="1.45" />
    <circle cx="5.5" cy="6" fill="currentColor" r="0.8" />
    <circle cx="8.5" cy="6" fill="currentColor" r="0.8" />
    <path
      d="M8 13 L10 15 L8 17 M16 13 L14 15 L16 17"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.45"
    />
  </svg>
);

/**
 * Phone outline — Mobile App feature icon.
 *
 * @param props - Component props.
 * @returns The rendered MobileIcon element.
 * @example
 * ```tsx
 * <MobileIcon />
 * ```
 */

export const MobileIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    <rect height="18" rx="3" stroke="currentColor" strokeWidth="1.45" width="12" x="6" y="3" />
    <path d="M10 18 H14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.45" />
  </svg>
);

/**
 * Google Chrome mark — Browser Extension feature icon (official silhouette).
 *
 * @param props - Component props.
 * @returns The rendered ExtensionIcon element.
 * @example
 * ```tsx
 * <ExtensionIcon />
 * ```
 */

export const ExtensionIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="currentColor" viewBox="0 0 24 24" {...props}>
    {/* simple-icons googlechrome path — mono so FeatureStrip can tint with currentColor */}
    <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z" />
  </svg>
);

/**
 * Price tag with dollar sign.
 *
 * @param props - Component props.
 * @returns The rendered PriceTagIcon element.
 * @example
 * ```tsx
 * <PriceTagIcon />
 * ```
 */

export const PriceTagIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    <path
      d="M12 3.5 L20 19.5 H4 Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.45"
    />
    <circle cx="12" cy="8" fill="currentColor" r="0.9" />
    <path
      d="M12 11 C12 9.7 14 9.7 14 11 C14 12.3 12 12.3 12 13.6 C12 14.9 10 14.9 10 13.6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.45"
    />
  </svg>
);

/**
 * Shield with check — refund trust line.
 *
 * @param props - Component props.
 * @returns The rendered ShieldCheckIcon element.
 * @example
 * ```tsx
 * <ShieldCheckIcon />
 * ```
 */

export const ShieldCheckIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    <path
      d="M12 3 L20 6 V11 C20 16 16.5 19.5 12 21 C7.5 19.5 4 16 4 11 V6 Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M9 12 L11 14 L15 10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * Warning triangle for the assistant chat privacy strip (dev-only, not public).
 *
 * @param props - Component props.
 * @returns The rendered ChatPrivateWarningIcon element.
 * @example
 * ```tsx
 * <ChatPrivateWarningIcon className="size-3.5" />
 * ```
 */
export const ChatPrivateWarningIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    <path
      d="M12 3.4 L21.2 19.2 C21.55 19.8 21.12 20.55 20.42 20.55 H3.58 C2.88 20.55 2.45 19.8 2.8 19.2 L12 3.4 Z"
      fill="currentColor"
      fillOpacity="0.14"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
    <path d="M12 9.2 V13.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    <circle cx="12" cy="16.6" fill="currentColor" r="1.15" />
  </svg>
);

/**
 * Circle check — pricing bullets (filled terminal green via CSS).
 *
 * @param props - Component props.
 * @returns The rendered CheckCircleIcon element.
 * @example
 * ```tsx
 * <CheckCircleIcon />
 * ```
 */

export const CheckCircleIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" fill="currentColor" opacity="0.18" r="9" />
    <circle cx="12" cy="12" fill="none" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M8 12 L11 15 L16 9"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * Active-agent check — solid disc + tick for the coding-agent menu.
 * Pair with a ping ring for the heartbeam pulse.
 *
 * @param props - Component props.
 * @returns The rendered ActiveAgentCheckIcon element.
 * @example
 * ```tsx
 * <ActiveAgentCheckIcon className="size-3.5 text-emerald-600" />
 * ```
 */
export const ActiveAgentCheckIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" fill="currentColor" r="10" />
    <path
      d="M7.6 12.2 L10.5 15.1 L16.6 8.8"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
    />
  </svg>
);

/**
 * Shopping cart — checkout proceed animation.
 *
 * @param props - Component props.
 * @returns The rendered CartIcon element.
 * @example
 * ```tsx
 * <CartIcon />
 * ```
 */

export const CartIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    <path
      d="M4 5 H6 L7.5 14 H18 L20 7 H8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <circle cx="9" cy="18" fill="currentColor" r="1.2" />
    <circle cx="17" cy="18" fill="currentColor" r="1.2" />
  </svg>
);

/**
 * Lock icon for checkout CTA.
 *
 * @param props - Component props.
 * @returns The rendered LockIcon element.
 * @example
 * ```tsx
 * <LockIcon />
 * ```
 */

export const LockIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    <rect height="10" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="10" />
    <path
      d="M8 10 V7 C8 4.8 9.8 3 12 3 C14.2 3 16 4.8 16 7 V10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * Clock icon for limited-time offer label.
 *
 * @param props - Component props.
 * @returns The rendered ClockIcon element.
 * @example
 * ```tsx
 * <ClockIcon />
 * ```
 */

export const ClockIcon = ({ className, ...props }: IconProps) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 7 V12 L15 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
  </svg>
);

/**
 * Chevron for carousel arrows.
 *
 * @param props - Component props.
 * @returns The rendered ChevronIcon element.
 * @example
 * ```tsx
 * <ChevronIcon />
 * ```
 */

export const ChevronIcon = ({
  className,
  direction = 'left',
  ...props
}: IconProps & { direction?: 'left' | 'right' }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
    {direction === 'left' ? (
      <path
        d="M15 6 L9 12 L15 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    ) : (
      <path
        d="M9 6 L15 12 L9 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    )}
  </svg>
);

const FEATURE_ICONS = {
  operator: AIOperatorIcon,
  web: WebAppIcon,
  mobile: MobileIcon,
  extension: ExtensionIcon,
  price: PriceTagIcon,
} as const;

/**
 * Resolve a feature-strip icon by id.
 *
 * @param props - Component props.
 * @returns The rendered FeatureIcon element.
 * @example
 * ```tsx
 * <FeatureIcon />
 * ```
 */

export const FeatureIcon = ({
  type,
  className,
}: {
  type: keyof typeof FEATURE_ICONS;
  className?: string;
}) => {
  const Icon = FEATURE_ICONS[type];
  return <Icon className={className} />;
};
