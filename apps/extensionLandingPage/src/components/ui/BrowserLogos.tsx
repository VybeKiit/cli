import type { SVGProps } from 'react';
import { siGooglechrome } from 'simple-icons';

/**
 * Google Chrome brand mark — path + brand color sourced from `simple-icons`
 * (a true vendor brand seam, so the brand hex is intentional here, not a token).
 *
 * @param props - Standard SVG props (className, sizing) forwarded to the svg.
 * @returns The Chrome logo in its brand color.
 * @example
 * <ChromeLogo className="h-4 w-4" />
 */
export const ChromeLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill={`#${siGooglechrome.hex}`}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d={siGooglechrome.path} />
  </svg>
);

/**
 * Microsoft Edge brand mark — inlined at this vendor brand seam because
 * `simple-icons` no longer ships an Edge glyph. Two-tone brand fill is
 * intentional here (a brand mark), not a design token.
 *
 * @param props - Standard SVG props (className, sizing) forwarded to the svg.
 * @returns The Edge logo in its brand colors.
 * @example
 * <EdgeLogo className="h-4 w-4" />
 */
export const EdgeLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill="none"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M21.86 14.02c0 .34-.04.68-.1 1.02-.6 2.86-2.82 5.24-5.7 6.16-.9.28-1.86.44-2.86.44-2.9 0-5.44-1.5-6.9-3.78 1.24 1 2.82 1.6 4.54 1.6 2.9 0 5.42-1.7 6.6-4.16.34-.7.16-1.54-.44-2.02-.5-.4-1.2-.42-1.76-.1-.86.5-1.86.78-2.94.78-2.68 0-4.9-1.94-5.36-4.5-.02-.14-.04-.28-.04-.42 0-1.9 1-3.56 2.5-4.5C5.9 1.24 3.36 3.4 2.5 6.3 2.18 7.4 2 8.56 2 9.76c0 .5.04 1 .1 1.48C2.66 6.06 6.86 2 12 2c3.28 0 6.2 1.62 7.98 4.1.02.02.02.04.04.06.02.02.02.04.04.06 1.1 1.56 1.76 3.46 1.76 5.52v.02c.02.72.02 1.5.02 2.16z"
      fill="#0078D7"
    />
    <path
      d="M9.9 3.5C8.4 4.44 7.4 6.1 7.4 8c0 .14.02.28.04.42.46 2.56 2.68 4.5 5.36 4.5 1.08 0 2.08-.28 2.94-.78.56-.32 1.26-.3 1.76.1a1.6 1.6 0 0 1 .44 2.02c-1.18 2.46-3.7 4.16-6.6 4.16-1.72 0-3.3-.6-4.54-1.6-.7-1.06-1.14-2.3-1.26-3.62a9.5 9.5 0 0 1 .06-2.14C6.18 5.6 7.8 4.02 9.9 3.5z"
      fill="#0C59A4"
    />
  </svg>
);
