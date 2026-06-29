import {
  siCloudflare,
  siExpo,
  siGithub,
  siGoogle,
  siGooglechrome,
  siGoogleplay,
  siMongodb,
  siNextdotjs,
  siNodedotjs,
  siPlausibleanalytics,
  siReact,
  siResend,
  siSentry,
  siStripe,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVercel,
  type SimpleIcon,
} from 'simple-icons';

import { cn } from '@/lib/utils';

export type LogoMarkIconData = Pick<SimpleIcon, 'title' | 'slug' | 'path'> & {
  readonly viewBox?: string;
};

/**
 * Official full-color raster marks (64×64 WebP @ q90).
 * Shared: codex + openai → openai.webp (grill lock: Codex is the OpenAI mark).
 */
export const LOGO_MARK_RASTERS: Record<string, string> = {
  openai: '/brand-marks/openai.webp',
  codex: '/brand-marks/openai.webp',
  amazonaws: '/brand-marks/aws.webp',
  paypal: '/brand-marks/paypal.webp',
  figma: '/brand-marks/figma.webp',
  cursor: '/brand-marks/cursor.webp',
  claude: '/brand-marks/claude.webp',
  lemonsqueezy: '/brand-marks/lemonsqueezy.webp',
  betterauth: '/brand-marks/betterauth.webp',
  wxt: '/brand-marks/wxt.webp',
  sonner: '/brand-marks/sonner.webp',
  googleplay: '/brand-marks/googleplay.webp',
  googlechrome: '/brand-marks/googlechrome.webp',
  appstore: '/brand-marks/appstore.webp',
};

const customSvgMarks: Record<string, LogoMarkIconData> = {
  shadcn: {
    title: 'shadcn/ui',
    slug: 'shadcn',
    viewBox: '0 0 24 24',
    path: 'M12 2 L20 7 V17 L12 22 L4 17 V7 Z M12 6.5 L8 9 V15 L12 17.5 L16 15 V9 Z',
  },
  playwright: {
    title: 'Playwright',
    slug: 'playwright',
    viewBox: '0 0 24 24',
    path: 'M8 4 L16 4 L20 8 L20 16 L16 20 L8 20 L4 16 L4 8 Z M9 9 H15 V11 H9 Z M9 13 H13 V15 H9 Z',
  },
};

export const LOGO_MARK_ICONS: Record<string, LogoMarkIconData> = {
  nextdotjs: siNextdotjs,
  tailwindcss: siTailwindcss,
  typescript: siTypescript,
  react: siReact,
  shadcn: customSvgMarks.shadcn!,
  supabase: siSupabase,
  cloudflare: siCloudflare,
  expo: siExpo,
  resend: siResend,
  stripe: siStripe,
  vercel: siVercel,
  mongodb: siMongodb,
  google: siGoogle,
  sentry: siSentry,
  plausible: siPlausibleanalytics,
  github: siGithub,
  nodedotjs: siNodedotjs,
  playwright: customSvgMarks.playwright!,
  googlechrome: siGooglechrome,
  googleplay: siGoogleplay,
  appstore: {
    title: 'App Store',
    slug: 'appstore',
    viewBox: '0 0 24 24',
    path: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z',
  },
};

interface LogoMarkIconProps {
  readonly slug: string;
  readonly className?: string;
  readonly variant?: 'flat' | '3d';
}

function markSrc(slug: string, variant: 'flat' | '3d'): string | undefined {
  if (variant === '3d') {
    return `/brand-marks-3d/${slug}.webp`;
  }
  return LOGO_MARK_RASTERS[slug];
}

/** Official brand mark — raster WebP when available, otherwise mono SVG path. */
export function LogoMarkIcon({ slug, className, variant = 'flat' }: LogoMarkIconProps) {
  const rasterSrc = markSrc(slug, variant) ?? LOGO_MARK_RASTERS[slug];
  if (rasterSrc) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className={cn('logo-mark-icon object-contain transition-opacity duration-300', className)}
        data-mark-slug={slug}
        decoding="async"
        draggable={false}
        height={22}
        onError={(event) => {
          if (variant === '3d') {
            const flat = LOGO_MARK_RASTERS[slug];
            if (flat) {
              event.currentTarget.src = flat;
            }
          }
        }}
        src={rasterSrc}
        width={22}
      />
    );
  }

  const icon = LOGO_MARK_ICONS[slug];
  if (!icon) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      role="img"
      viewBox={icon.viewBox ?? '0 0 24 24'}
    >
      <path d={icon.path} />
    </svg>
  );
}
