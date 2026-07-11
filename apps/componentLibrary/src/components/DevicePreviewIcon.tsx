import type { PageRecipeDevice } from '@library/lib/pageRecipeViewport';
import type { SVGProps } from 'react';

interface DevicePreviewIconProps extends SVGProps<SVGSVGElement> {
  readonly device: PageRecipeDevice;
}

/**
 * Device glyph for Page recipe frame captions.
 *
 * @param props - Device tier plus SVG attributes.
 * @returns An inline SVG icon for mobile, tablet, or desktop.
 * @example
 * const element = <DevicePreviewIcon className="h-4 w-4" device="mobile" />;
 */
export const DevicePreviewIcon = ({ device, ...props }: DevicePreviewIconProps) => {
  if (device === 'mobile') {
    return (
      <svg aria-label="Mobile preview" fill="none" role="img" viewBox="0 0 24 24" {...props}>
        <rect height="20" rx="3.5" stroke="currentColor" strokeWidth="1.8" width="12" x="6" y="2" />
        <path d="M10 5h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="12" cy="18" fill="currentColor" r="1" />
      </svg>
    );
  }

  if (device === 'tablet') {
    return (
      <svg aria-label="Tablet preview" fill="none" role="img" viewBox="0 0 24 24" {...props}>
        <rect
          height="17"
          rx="2.8"
          stroke="currentColor"
          strokeWidth="1.8"
          width="14"
          x="5"
          y="3.5"
        />
        <path d="M9 6.5h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <circle cx="12" cy="17.5" fill="currentColor" r="1" />
      </svg>
    );
  }

  return (
    <svg aria-label="Desktop preview" fill="none" role="img" viewBox="0 0 24 24" {...props}>
      <rect height="12" rx="2" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="4" />
      <path d="M9 20h6M12 16v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M6.5 7.5h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
};
