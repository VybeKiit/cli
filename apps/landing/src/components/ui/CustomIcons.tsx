import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/** Stacked chevron VybeKiit logo mark. */
export function VybeLogoIcon({ className, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6 8 L16 14 L26 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M6 14 L16 20 L26 14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        d="M6 20 L16 26 L26 20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

type VybeBrandMarkProps = IconProps & {
  readonly accent?: boolean;
};

/** Compact brand mark for footer and tight UI slots. */
export function VybeBrandMark({ accent = true, className, ...props }: VybeBrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 6.5 L12 11.5 L20 6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="M4 12 L12 17 L20 12"
        stroke={accent ? '#60a5fa' : 'currentColor'}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
      <path
        d="M4 17.5 L12 22.5 L20 17.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

/** Hexagon badge with star — AI Operator feature icon. */
export function AIOperatorIcon({ className, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M12 2.5 L19 6.5 V17.5 L12 21.5 L5 17.5 V6.5 Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12 7.5 L13.4 11 H17 L14.3 13.2 L15.4 17 L12 14.8 L8.6 17 L9.7 13.2 L7 11 H10.6 Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/** Browser window — Web App feature icon. */
export function WebAppIcon({ className, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
      <rect height="16" rx="2" stroke="currentColor" strokeWidth="1.8" width="20" x="2" y="4" />
      <path d="M2 8 H22" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="5.5" cy="6" fill="currentColor" r="0.8" />
      <circle cx="8.5" cy="6" fill="currentColor" r="0.8" />
      <path d="M7 13 H17 M7 16 H13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

/** Phone outline — Mobile App feature icon. */
export function MobileIcon({ className, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
      <rect height="18" rx="3" stroke="currentColor" strokeWidth="1.8" width="12" x="6" y="3" />
      <path d="M10 18 H14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

/** Star outline — Browser Extension feature icon. */
export function ExtensionIcon({ className, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M12 3 L14.2 9.2 L21 9.2 L15.4 13.3 L17.6 19.5 L12 15.4 L6.4 19.5 L8.6 13.3 L3 9.2 L9.8 9.2 Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/** Price tag with dollar sign. */
export function PriceTagIcon({ className, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M5 5 L19 5 L15 19 L5 19 Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="8" cy="8" fill="currentColor" r="1" />
      <path
        d="M12 10 C12 8.5 14 8.5 14 10 C14 11.5 12 11.5 12 13 C12 14.5 10 14.5 10 13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/** Shield with check — refund trust line. */
export function ShieldCheckIcon({ className, ...props }: IconProps) {
  return (
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
}

/** Circle check — pricing bullets (filled terminal green via CSS). */
export function CheckCircleIcon({ className, ...props }: IconProps) {
  return (
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
}

/** Shopping cart — checkout proceed animation. */
export function CartIcon({ className, ...props }: IconProps) {
  return (
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
}

/** Lock icon for checkout CTA. */
export function LockIcon({ className, ...props }: IconProps) {
  return (
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
}

/** Clock icon for limited-time offer label. */
export function ClockIcon({ className, ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7 V12 L15 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

/** Chevron for carousel arrows. */
export function ChevronIcon({
  className,
  direction = 'left',
  ...props
}: IconProps & { direction?: 'left' | 'right' }) {
  return (
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
}

const FEATURE_ICONS = {
  operator: AIOperatorIcon,
  web: WebAppIcon,
  mobile: MobileIcon,
  extension: ExtensionIcon,
  price: PriceTagIcon,
} as const;

/** Resolve a feature-strip icon by id. */
export function FeatureIcon({
  type,
  className,
}: {
  type: keyof typeof FEATURE_ICONS;
  className?: string;
}) {
  const Icon = FEATURE_ICONS[type];
  return <Icon className={className} />;
}
