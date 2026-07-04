'use client';

import { CodexMark } from '@vybekiit-template-web/components/builder-assistant-mark';
import {
  type SimpleIcon,
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
} from 'simple-icons';
import { cn } from '@/lib/utils';

export type LogoMarkIconData = Pick<SimpleIcon, 'title' | 'slug' | 'path'> & {
  readonly viewBox?: string;
};

/**
 * Official full-color raster marks (128×128 WebP @ q92, transparent).
 * Codex uses the inline SVG cloud mark — not the OpenAI blossom raster.
 */
export const LOGO_MARK_RASTERS: Record<string, string> = {
  openai: '/brand-marks/openai.webp',
  amazonaws: '/brand-marks/aws.webp',
  paypal: '/brand-marks/paypal.webp',
  figma: '/brand-marks/figma.webp',
  cursor: '/brand-marks/cursor.webp',
  claude: '/brand-marks/claude.webp',
  lemonsqueezy: '/brand-marks/lemonsqueezy.webp',
  betterauth: '/brand-marks/betterauth.webp',
  wxt: '/brand-marks/wxt.webp',
  sonner: '/brand-marks/sonner.webp',
  google: '/brand-marks/google.webp',
  googleplay: '/brand-marks/googleplay.webp',
  googlechrome: '/brand-marks/googlechrome.webp',
  appstore: '/brand-marks/appstore.webp',
  cloudflare: '/brand-marks/cloudflare.webp',
  expo: '/brand-marks/expo.webp',
  github: '/brand-marks/github.webp',
  mongodb: '/brand-marks/mongodb.webp',
  nextdotjs: '/brand-marks/nextdotjs.webp',
  nodedotjs: '/brand-marks/nodedotjs.webp',
  plausible: '/brand-marks/plausible.webp',
  react: '/brand-marks/react.webp',
  resend: '/brand-marks/resend.webp',
  sentry: '/brand-marks/sentry.webp',
  stripe: '/brand-marks/stripe.webp',
  supabase: '/brand-marks/supabase.webp',
  tailwindcss: '/brand-marks/tailwindcss.webp',
  typescript: '/brand-marks/typescript.webp',
  vercel: '/brand-marks/vercel.webp',
};

const customSvgMarks: Record<string, LogoMarkIconData> = {
  // simple-icons dropped OpenAI over trademark policy; keep the canonical blossom path.
  openai: {
    title: 'OpenAI',
    slug: 'openai',
    viewBox: '0 0 24 24',
    path: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
  },
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
  openai: customSvgMarks.openai!,
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
  /** Force the transparent SVG silhouette (currentColor-tinted) over the raster.
   *  Needed on dark bands where the rasters' baked-in white tile reads as a box. */
  readonly mono?: boolean;
}

/** Official brand mark — raster WebP when available, otherwise mono SVG path. */
export function LogoMarkIcon({ slug, className, mono = false }: LogoMarkIconProps) {
  if (slug === 'codex') {
    return (
      <CodexMark
        className={cn('logo-mark-icon object-contain transition-opacity duration-300', className)}
      />
    );
  }

  const rasterSrc = mono ? undefined : LOGO_MARK_RASTERS[slug];
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
