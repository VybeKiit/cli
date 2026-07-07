export interface TrustLogoAsset {
  readonly slug: string;
  readonly label: string;
  readonly brandHex: string;
  /** WebP raster or SVG path under public/ */
  readonly src: string;
  readonly kind: 'webp' | 'svg';
  readonly invertOnDark?: boolean;
}

/** Curated trust logos — stack + company marks for logo-trust-grid. */
export const TRUST_GRID_LOGOS: readonly TrustLogoAsset[] = [
  {
    slug: 'nextdotjs',
    label: 'Next.js',
    brandHex: '#000000',
    src: '/brand-marks/nextdotjs.webp',
    kind: 'webp',
  },
  {
    slug: 'tailwindcss',
    label: 'Tailwind CSS',
    brandHex: '#06B6D4',
    src: '/brand-marks/tailwindcss.webp',
    kind: 'webp',
  },
  {
    slug: 'supabase',
    label: 'Supabase',
    brandHex: '#3FCF8E',
    src: '/brand-marks/supabase.webp',
    kind: 'webp',
  },
  {
    slug: 'stripe',
    label: 'Stripe',
    brandHex: '#635BFF',
    src: '/brand-marks/stripe.webp',
    kind: 'webp',
  },
  {
    slug: 'openai',
    label: 'OpenAI',
    brandHex: '#10A37F',
    src: '/brand-marks/openai.webp',
    kind: 'webp',
  },
  {
    slug: 'resend',
    label: 'Resend',
    brandHex: '#000000',
    src: '/brand-marks/resend.webp',
    kind: 'webp',
    invertOnDark: true,
  },
  {
    slug: 'vercel',
    label: 'Vercel',
    brandHex: '#000000',
    src: '/brand-marks/vercel.webp',
    kind: 'webp',
    invertOnDark: true,
  },
  {
    slug: 'microsoft',
    label: 'Microsoft',
    brandHex: '#00A4EF',
    src: '/logos/marquee/microsoft.svg',
    kind: 'svg',
  },
  {
    slug: 'google',
    label: 'Google',
    brandHex: '#4285F4',
    src: '/logos/marquee/google.svg',
    kind: 'svg',
  },
  { slug: 'meta', label: 'Meta', brandHex: '#0866FF', src: '/logos/marquee/meta.svg', kind: 'svg' },
  {
    slug: 'linkedin',
    label: 'LinkedIn',
    brandHex: '#0A66C2',
    src: '/logos/marquee/linkedin.svg',
    kind: 'svg',
  },
  {
    slug: 'apple',
    label: 'Apple',
    brandHex: '#A2AAAD',
    src: '/logos/marquee/apple.svg',
    kind: 'svg',
    invertOnDark: true,
  },
] as const;
