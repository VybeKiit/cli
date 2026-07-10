'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { MiniBrowserChrome } from '@/components/landing/kit/MiniBrowserChrome';
import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import type { PageRecipePreview } from '@/data/pageRecipes';
import { cdnAssetUrl } from '@/lib/cdnAssets';
import { cn } from '@/lib/utils';

interface PageRecipeCardProps {
  readonly recipe: PageRecipePreview;
  /** Avoid duplicate keys when the marquee clones the row. */
  readonly instanceKey: string;
  /**
   * When true, skip IntersectionObserver and mount the mini screen on first paint.
   * Use for the featured ready row so buyers see real UI immediately.
   */
  readonly eager?: boolean;
  /** Featured = larger card + milder scatter; compact = catalog marquee. */
  readonly size?: 'compact' | 'featured';
}

interface RecipeCardPose {
  readonly rotate: number;
  readonly offsetY: number;
  readonly offsetX: number;
  readonly scale: number;
  readonly height: number;
  readonly darkChrome: boolean;
  readonly zIndex: number;
}

/** Official brand rasters already in /brand-marks (via LogoMarkIcon). */
const RASTER_BRANDS = new Set(['google', 'github', 'stripe']);

/** Simple-icons / brand SVG files under public/brand-marks. */
const SVG_BRANDS: Readonly<Record<string, string>> = {
  slack: '/brand-marks/slack.svg',
  linear: '/brand-marks/linear.svg',
  notion: '/brand-marks/notion.svg',
};

/**
 * Compact official brand mark for mini recipe screens (WebP raster or SVG).
 *
 * @param props - Brand slug + optional className.
 * @returns 16–20px brand icon.
 * @example
 * <MiniBrand slug="stripe" />
 */
const MiniBrand = ({ slug, className }: { readonly slug: string; readonly className?: string }) => {
  if (RASTER_BRANDS.has(slug)) {
    return <LogoMarkIcon className={cn('size-3.5 shrink-0', className)} slug={slug} />;
  }

  const svgSrc = SVG_BRANDS[slug];
  if (!svgSrc) {
    return null;
  }

  return (
    <img
      alt=""
      aria-hidden="true"
      className={cn('size-3.5 shrink-0 object-contain', className)}
      decoding="async"
      draggable={false}
      height={14}
      loading="lazy"
      src={cdnAssetUrl(svgSrc)}
      width={14}
    />
  );
};

/**
 * Stable 32-bit hash for recipe ids so layout poses stay SSR-safe and consistent
 * across marquee clones (not Math.random).
 *
 * @param value - Recipe id string.
 * @returns Unsigned 32-bit integer hash.
 * @example
 * hashString('auth') // → 2087938416
 */
const hashString = (value: string): number => {
  let hash = 2_166_136_261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
};

/**
 * Map a recipe id to a scattered card pose so the marquee never looks like a
 * flat equal-height grid. Featured size uses milder offsets so product UI stays readable.
 *
 * @param recipeId - Stable recipe id.
 * @param size - compact catalog vs featured ready row.
 * @returns Pose numbers for transform, height, and content crop.
 * @example
 * poseForRecipe('checkout') // → { rotate: -2.4, offsetY: 10, … }
 */
const poseForRecipe = (
  recipeId: string,
  size: 'compact' | 'featured' = 'compact',
): RecipeCardPose => {
  const h = hashString(recipeId);
  const unit = (shift: number) => ((h >>> shift) & 0xff) / 255;
  const rotateSign = (h & 1) === 0 ? -1 : 1;
  const darkChrome = unit(28) > 0.72;
  const zIndex = 1 + Math.floor(unit(10) * 8);

  if (size === 'featured') {
    // Subtle scatter — buyers should read the product UI, not the card dance.
    return {
      rotate: rotateSign * (0.25 + unit(0) * 1.1), // ~±0.25° … ±1.35°
      offsetY: Math.round(-4 + unit(8) * 8), // -4 … +4
      offsetX: Math.round(-2 + unit(16) * 4), // -2 … +2
      scale: 0.99 + unit(4) * 0.02, // 0.99 … 1.01
      height: Math.round(218 + unit(12) * 14), // 218 … 232
      darkChrome,
      zIndex,
    };
  }

  // Mild scatter only — no content pan/zoom (that was clipping real UI).
  return {
    rotate: rotateSign * (0.8 + unit(0) * 3.2), // ~±0.8° … ±4°
    offsetY: Math.round(-12 + unit(8) * 24), // -12 … +12
    offsetX: Math.round(-4 + unit(16) * 8), // -4 … +4
    scale: 0.96 + unit(4) * 0.08, // 0.96 … 1.04
    height: Math.round(188 + unit(12) * 28), // 188 … 216
    darkChrome,
    zIndex,
  };
};

/**
 * Static chrome placeholder shown before the mini screen mounts (lazy catalog cards).
 * Reads like a SaaS shell, not a pulse circle.
 *
 * @returns Skeleton UI chrome.
 */
const RecipeScreenSkeleton = () => (
  <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-[#0f172a]">
    <div className="flex min-h-0 flex-1">
      <div className="flex w-7 shrink-0 flex-col items-center gap-1.5 border-slate-100 border-e bg-slate-50 py-2">
        <div className="size-2.5 rounded bg-slate-300/80" />
        <div className="size-2 rounded-sm bg-slate-200" />
        <div className="size-2 rounded-sm bg-slate-200" />
        <div className="mt-auto size-2 rounded-full bg-slate-200" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-2 w-16 rounded bg-slate-200/90" />
          <div className="h-2 w-8 rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="h-7 rounded-md border border-slate-100 bg-slate-50" />
          <div className="h-7 rounded-md border border-slate-100 bg-slate-50" />
          <div className="h-7 rounded-md border border-slate-100 bg-slate-50" />
        </div>
        <div className="min-h-0 flex-1 rounded-md border border-slate-100 bg-gradient-to-b from-slate-50 to-white" />
        <div className="h-2 w-3/5 rounded bg-slate-100" />
      </div>
    </div>
  </div>
);

const Shell = ({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) => (
  <div
    className={cn(
      'flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white text-[#0f172a]',
      className,
    )}
  >
    {children}
  </div>
);

const Dot = ({ className }: { readonly className?: string }) => (
  <span className={cn('inline-block size-1.5 shrink-0 rounded-full', className)} />
);

/** Map mock-UI tones to solid dot background classes (flat lookup, no nested ternaries). */
const DOT_TONE_BG: Readonly<Record<string, string>> = {
  green: 'bg-emerald-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
};

/**
 * Resolve a solid Dot className for a mock-UI tone key.
 *
 * @param tone - Named tone (green | violet | amber | blue).
 * @param extra - Optional class prefix (e.g. `mt-1`).
 * @returns Combined class string for Dot.
 */
const dotToneClass = (tone: string, extra = ''): string => {
  const bg = DOT_TONE_BG[tone] ?? 'bg-slate-400';
  return extra.length > 0 ? `${extra} ${bg}` : bg;
};

const Pill = ({
  children,
  tone = 'muted',
}: {
  readonly children: ReactNode;
  readonly tone?: 'muted' | 'blue' | 'green' | 'amber' | 'red' | 'violet';
}) => {
  const tones = {
    muted: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
    red: 'bg-red-50 text-red-700',
    violet: 'bg-violet-50 text-violet-700',
  } as const;
  return (
    <span className={cn('rounded px-1 py-0.5 font-medium text-[7px] leading-none', tones[tone])}>
      {children}
    </span>
  );
};

/** Unique mini SaaS screens keyed by recipe id — not generic grey blocks. */
const SCREENS: Record<string, () => ReactNode> = {
  auth: () => (
    <Shell className="items-center justify-center gap-1 bg-gradient-to-b from-slate-50 to-white p-2">
      <div className="flex size-6 items-center justify-center rounded-lg bg-blue-600 font-bold text-[9px] text-white shadow-sm">
        V
      </div>
      <p className="font-semibold text-[10px] leading-none">Welcome back</p>
      <p className="text-[7px] text-slate-500">Sign in to your workspace</p>
      <div className="mt-0.5 w-full max-w-[168px] space-y-1">
        <button
          className="flex w-full items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left font-medium text-[8px] shadow-sm"
          type="button"
        >
          <MiniBrand className="size-3.5" slug="google" />
          <span className="min-w-0 flex-1 truncate">Continue with Google</span>
        </button>
        <button
          className="flex w-full items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left font-medium text-[8px] shadow-sm"
          type="button"
        >
          <MiniBrand className="size-3.5" slug="github" />
          <span className="min-w-0 flex-1 truncate">Continue with GitHub</span>
        </button>
        <div className="flex items-center gap-1 py-0.5">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="shrink-0 text-[7px] text-slate-400">or email</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="rounded-md border border-slate-200 px-2 py-1 text-[8px] text-slate-400">
          you@studio.com
        </div>
        <div className="rounded-md bg-blue-600 py-1.5 text-center font-medium text-[8px] text-white">
          Sign in with magic link
        </div>
      </div>
    </Shell>
  ),

  onboarding: () => (
    <Shell className="p-2">
      <div className="mb-1.5 flex items-center gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn('h-1 flex-1 rounded-full', step <= 2 ? 'bg-blue-600' : 'bg-slate-200')}
          />
        ))}
      </div>
      <p className="truncate font-semibold text-[10px]">What are you shipping?</p>
      <p className="mb-1.5 truncate text-[8px] text-slate-500">
        Pick a starter — agent wires the rest.
      </p>
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-1">
        {[
          { t: 'SaaS', d: 'Payments + auth' },
          { t: 'Course', d: 'Checkout + LMS' },
          { t: 'Agency', d: 'CRM + portal' },
          { t: 'AI tool', d: 'Chat + billing' },
        ].map((card, i) => (
          <div
            key={card.t}
            className={cn(
              'min-w-0 rounded-md border p-1.5',
              i === 0
                ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-500/20'
                : 'border-slate-200',
            )}
          >
            <p className="truncate font-medium text-[9px]">{card.t}</p>
            <p className="truncate text-[7px] text-slate-500">{card.d}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto shrink-0 rounded-md bg-blue-600 py-1.5 text-center font-medium text-[9px] text-white">
        Continue →
      </div>
    </Shell>
  ),

  'idea-planner': () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Idea planner</p>
        <Pill tone="violet">AI</Pill>
      </div>
      <div className="mb-1.5 rounded-md border border-violet-200 bg-violet-50/60 p-1.5">
        <p className="text-[8px] text-violet-900 leading-snug">
          “Course platform with cohort chat + Stripe”
        </p>
      </div>
      <div className="space-y-1">
        {['Auth + seats', 'Checkout + tax', 'Lesson player', 'Cohort chat'].map((item, i) => (
          <div key={item} className="flex items-center gap-1.5 text-[8px]">
            <span
              className={cn(
                'flex size-3.5 items-center justify-center rounded border text-[7px]',
                i < 3 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300',
              )}
            >
              {i < 3 ? '✓' : ''}
            </span>
            <span className={i < 3 ? 'text-slate-700' : 'text-slate-400'}>{item}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto flex gap-1">
        <div className="h-6 flex-1 rounded border border-slate-200 bg-slate-50" />
        <div className="h-6 rounded bg-violet-600 px-2 font-medium text-[8px] text-white leading-6">
          Build plan
        </div>
      </div>
    </Shell>
  ),

  'dashboard-home': () => (
    <Shell className="flex-row">
      <div className="flex w-8 shrink-0 flex-col items-center gap-1.5 border-slate-100 border-e bg-slate-50 py-2">
        <div className="size-3 rounded bg-blue-600" />
        <div className="size-2.5 rounded-sm bg-slate-300" />
        <div className="size-2.5 rounded-sm bg-slate-300" />
        <div className="mt-auto size-2.5 rounded-full bg-slate-300" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[10px]">Good morning, Ava</p>
          <Pill tone="green">Live</Pill>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { l: 'MRR', v: '$12.4k', c: 'text-emerald-600' },
            { l: 'Active', v: '1,284', c: '' },
            { l: 'Churn', v: '1.2%', c: 'text-amber-600' },
          ].map((s) => (
            <div key={s.l} className="rounded-md border border-slate-100 bg-slate-50/80 p-1">
              <p className="text-[7px] text-slate-500">{s.l}</p>
              <p className={cn('font-semibold text-[10px] tabular-nums', s.c)}>{s.v}</p>
            </div>
          ))}
        </div>
        <div className="min-h-0 flex-1 rounded-md border border-slate-100 bg-gradient-to-t from-blue-50 to-white p-1">
          <svg
            aria-hidden={true}
            className="h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 32"
          >
            <path
              d="M0 26 C12 24 18 18 30 16 C42 14 48 20 60 12 C72 6 84 8 100 4"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
            />
            <path
              d="M0 26 C12 24 18 18 30 16 C42 14 48 20 60 12 C72 6 84 8 100 4 L100 32 L0 32 Z"
              fill="url(#dashFill)"
              opacity="0.25"
            />
            <defs>
              <linearGradient id="dashFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </Shell>
  ),

  'command-center': () => (
    <Shell className="p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Command center</p>
        <Pill tone="blue">3 live</Pill>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-1">
        {[
          { t: 'Deploys', v: '12', sub: 'today', tone: 'green' as const },
          { t: 'Incidents', v: '0', sub: 'open', tone: 'green' as const },
          { t: 'Agents', v: '4', sub: 'running', tone: 'violet' as const },
          { t: 'Queue', v: '18', sub: 'jobs', tone: 'amber' as const },
        ].map((c) => (
          <div key={c.t} className="rounded-md border border-slate-100 p-1.5">
            <div className="mb-0.5 flex items-center justify-between">
              <span className="text-[7px] text-slate-500">{c.t}</span>
              <Dot className={dotToneClass(c.tone)} />
            </div>
            <p className="font-bold text-[12px] tabular-nums leading-none">{c.v}</p>
            <p className="text-[7px] text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>
    </Shell>
  ),

  'terms-of-service': () => (
    <Shell className="p-2">
      <p className="font-semibold text-[10px]">Terms of service</p>
      <p className="mb-1 text-[7px] text-slate-400">Last updated · Jun 2026</p>
      <div className="space-y-1 text-[8px] text-slate-600 leading-snug">
        <p className="font-medium text-slate-800">1. Acceptance</p>
        <p className="line-clamp-2">By using VybeKiit you agree to these terms…</p>
        <p className="font-medium text-slate-800">2. License</p>
        <p className="line-clamp-2">Lifetime access for your projects after purchase…</p>
        <div className="h-8 rounded bg-gradient-to-b from-transparent to-white" />
      </div>
    </Shell>
  ),

  'privacy-policy': () => (
    <Shell className="p-2">
      <p className="font-semibold text-[10px]">Privacy policy</p>
      <div className="mt-1 space-y-1">
        {[
          { t: 'Data we collect', i: 'Account, usage, payments' },
          { t: 'How we use it', i: 'Operate product · support' },
          { t: 'Your rights', i: 'Export · delete · opt-out' },
        ].map((row) => (
          <div key={row.t} className="rounded-md border border-slate-100 px-1.5 py-1">
            <p className="font-medium text-[8px]">{row.t}</p>
            <p className="text-[7px] text-slate-500">{row.i}</p>
          </div>
        ))}
      </div>
    </Shell>
  ),

  'user-settings': () => (
    <Shell className="flex-row">
      <div className="w-[72px] shrink-0 space-y-0.5 border-slate-100 border-e bg-slate-50 p-1.5">
        {['Profile', 'Security', 'Billing', 'Team'].map((item, i) => (
          <div
            key={item}
            className={cn(
              'rounded px-1 py-1 text-[7px]',
              i === 0 ? 'bg-white font-medium text-blue-700 shadow-sm' : 'text-slate-500',
            )}
          >
            {item}
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2">
        <div className="flex items-center gap-1.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-[10px] text-blue-700">
            AS
          </div>
          <div>
            <p className="font-semibold text-[9px]">Ava Stone</p>
            <p className="text-[7px] text-slate-500">ava@studio.com</p>
          </div>
        </div>
        <div className="rounded border border-slate-200 px-1.5 py-1 text-[8px]">Ava Stone</div>
        <div className="rounded border border-slate-200 px-1.5 py-1 text-[8px] text-slate-400">
          Product designer
        </div>
        <div className="mt-auto h-5 rounded bg-blue-600 text-center font-medium text-[8px] text-white leading-5">
          Save changes
        </div>
      </div>
    </Shell>
  ),

  'account-security': () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Security</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded-md border border-slate-100 p-1.5">
          <div>
            <p className="font-medium text-[8px]">Two-factor auth</p>
            <p className="text-[7px] text-slate-500">Authenticator app</p>
          </div>
          <div className="h-3.5 w-6 rounded-full bg-emerald-500 p-0.5">
            <div className="ml-auto size-2.5 rounded-full bg-white" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border border-slate-100 p-1.5">
          <div>
            <p className="font-medium text-[8px]">Passkeys</p>
            <p className="text-[7px] text-slate-500">2 devices</p>
          </div>
          <Pill tone="blue">Manage</Pill>
        </div>
        <div className="rounded-md border border-slate-100 p-1.5">
          <p className="mb-1 font-medium text-[8px]">Sessions</p>
          <div className="flex items-center gap-1 text-[7px] text-slate-500">
            <Dot className="bg-emerald-500" /> Mac · Chrome · Now
          </div>
        </div>
      </div>
    </Shell>
  ),

  pricing: () => (
    <Shell className="p-2">
      <p className="mb-1 text-center font-semibold text-[10px]">Simple pricing</p>
      <div className="grid grid-cols-2 gap-1">
        <div className="rounded-md border border-slate-200 p-1.5">
          <p className="font-medium text-[8px]">Starter</p>
          <p className="font-bold text-[12px]">$0</p>
          <p className="text-[7px] text-slate-500">Hobby</p>
        </div>
        <div className="rounded-md border-2 border-blue-500 bg-blue-50/50 p-1.5 ring-1 ring-blue-500/20">
          <div className="mb-0.5 flex items-center justify-between">
            <p className="font-medium text-[8px]">Pro</p>
            <Pill tone="blue">Popular</Pill>
          </div>
          <p className="font-bold text-[12px]">
            $29<span className="font-normal text-[7px] text-slate-500">/mo</span>
          </p>
          <p className="text-[7px] text-slate-500">Unlimited seats</p>
        </div>
      </div>
      <div className="mt-auto rounded-md bg-blue-600 py-1.5 text-center font-medium text-[9px] text-white">
        Start Pro trial
      </div>
    </Shell>
  ),

  'product-grid': () => (
    <Shell className="flex-row">
      <div className="w-[52px] shrink-0 space-y-0.5 border-slate-100 border-e bg-slate-50 p-1.5">
        {['All', 'Kits', 'UI', 'Add-ons'].map((item, i) => (
          <div
            key={item}
            className={cn(
              'rounded px-1 py-0.5 text-[6px]',
              i === 0 ? 'bg-white font-medium text-blue-700 shadow-sm' : 'text-slate-500',
            )}
          >
            {item}
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-1.5">
        <div className="flex items-center gap-1">
          <div className="min-w-0 flex-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[7px] text-slate-400">
            Search products…
          </div>
          <Pill tone="muted">12</Pill>
        </div>
        <div className="flex flex-wrap gap-0.5">
          <Pill tone="blue">Best sellers</Pill>
          <Pill tone="muted">Under $50</Pill>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-1">
          {[
            { n: 'Starter kit', p: '$29', c: 'from-blue-400 to-blue-600', tag: 'Hot' },
            { n: 'Agency pack', p: '$99', c: 'from-violet-400 to-violet-600', tag: '' },
            { n: 'UI kit', p: '$49', c: 'from-emerald-400 to-emerald-600', tag: 'New' },
            { n: 'Templates', p: '$19', c: 'from-amber-400 to-orange-500', tag: '' },
          ].map((p) => (
            <div key={p.n} className="overflow-hidden rounded-md border border-slate-100">
              <div className={cn('relative h-6 bg-gradient-to-br', p.c)}>
                {p.tag ? (
                  <span className="absolute end-0.5 top-0.5 rounded bg-white/90 px-0.5 font-semibold text-[5px] text-slate-700">
                    {p.tag}
                  </span>
                ) : null}
              </div>
              <div className="p-1">
                <p className="truncate font-medium text-[7px]">{p.n}</p>
                <p className="font-semibold text-[8px] tabular-nums">{p.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  ),

  'product-detail': () => (
    <Shell className="p-2">
      <div className="mb-1 flex gap-1.5">
        <div className="h-14 w-[42%] shrink-0 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap gap-0.5">
            <Pill tone="blue">Lifetime</Pill>
            <Pill tone="green">In stock</Pill>
          </div>
          <p className="font-semibold text-[10px] leading-tight">VybeKiit Lifetime</p>
          <p className="text-[7px] text-slate-500">Web · mobile · extension</p>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-[13px] tabular-nums">$29</span>
            <span className="text-[7px] text-slate-400 line-through">$655</span>
          </div>
        </div>
      </div>
      <ul className="mb-1 space-y-0.5 text-[7px] text-slate-600">
        <li className="flex items-center gap-1">
          <span className="text-emerald-600">✓</span> AI operator wired
        </li>
        <li className="flex items-center gap-1">
          <span className="text-emerald-600">✓</span> Payments + auth
        </li>
        <li className="flex items-center gap-1">
          <span className="text-emerald-600">✓</span> Lifetime updates
        </li>
      </ul>
      <div className="mt-auto flex gap-1">
        <div className="flex items-center rounded border border-slate-200 text-[8px]">
          <span className="px-1.5 text-slate-400">−</span>
          <span className="border-slate-200 border-x px-1.5 font-medium tabular-nums">1</span>
          <span className="px-1.5 text-slate-400">+</span>
        </div>
        <div className="flex-1 rounded-md bg-blue-600 py-1.5 text-center font-medium text-[9px] text-white">
          Add to cart
        </div>
      </div>
    </Shell>
  ),

  cart: () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Cart</p>
        <Pill tone="muted">2 items</Pill>
      </div>
      {[
        { n: 'VybeKiit Lifetime', p: '$29', q: '1', c: 'from-blue-400 to-blue-600' },
        { n: 'Priority support', p: '$19', q: '1', c: 'from-violet-400 to-violet-600' },
      ].map((item) => (
        <div
          key={item.n}
          className="mb-1 flex items-center gap-1.5 rounded-md border border-slate-100 p-1.5"
        >
          <div className={cn('size-7 shrink-0 rounded bg-gradient-to-br', item.c)} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[8px]">{item.n}</p>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="rounded border border-slate-200 px-1 text-[6px] text-slate-500 tabular-nums">
                qty {item.q}
              </span>
              <span className="font-semibold text-[8px] tabular-nums">{item.p}</span>
            </div>
          </div>
          <span className="text-[9px] text-slate-300">×</span>
        </div>
      ))}
      <div className="mt-auto space-y-0.5 border-slate-100 border-t pt-1.5 text-[7px]">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span className="tabular-nums">$48</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Tax</span>
          <span className="tabular-nums">Included</span>
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <span className="font-medium text-[8px]">Total</span>
          <span className="font-bold text-[11px] tabular-nums">$48</span>
        </div>
      </div>
      <div className="rounded-md bg-blue-600 py-1.5 text-center font-medium text-[9px] text-white">
        Checkout
      </div>
    </Shell>
  ),

  checkout: () => (
    <Shell className="p-2">
      <div className="mb-1 flex min-w-0 items-center justify-between gap-1">
        <p className="min-w-0 truncate font-semibold text-[10px]">Checkout</p>
        <div className="flex shrink-0 items-center gap-1">
          <MiniBrand className="size-3" slug="stripe" />
          <Pill tone="green">Secure</Pill>
        </div>
      </div>
      <div className="mb-1.5 rounded-md border border-slate-100 bg-slate-50 p-1.5">
        <p className="truncate font-medium text-[8px]">VybeKiit Lifetime</p>
        <p className="font-bold text-[12px] tabular-nums leading-tight">$29.00</p>
        <p className="truncate text-[7px] text-slate-500">Tax handled · MoR</p>
      </div>
      <div className="space-y-1">
        <div className="flex min-w-0 items-center gap-1 rounded border border-slate-200 px-1.5 py-1 text-[8px]">
          <span className="shrink-0 rounded bg-slate-800 px-1 text-[6px] text-white">VISA</span>
          <span className="truncate tabular-nums">···· 4242</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div className="min-w-0 truncate rounded border border-slate-200 px-1.5 py-1 text-[8px] text-slate-400">
            12 / 28
          </div>
          <div className="min-w-0 truncate rounded border border-slate-200 px-1.5 py-1 text-[8px] text-slate-400">
            CVC
          </div>
        </div>
      </div>
      <div className="mt-auto rounded-md bg-blue-600 py-1.5 text-center font-medium text-[8px] text-white">
        Pay $29.00
      </div>
    </Shell>
  ),

  orders: () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center justify-between gap-1">
        <p className="min-w-0 truncate font-semibold text-[10px]">Orders</p>
        <div className="flex items-center gap-0.5">
          <Pill tone="muted">This week</Pill>
          <Pill tone="blue">Export</Pill>
        </div>
      </div>
      <div className="mb-1 grid grid-cols-3 gap-1">
        {[
          { l: 'Paid', v: '12', c: 'text-emerald-600' },
          { l: 'Refunds', v: '1', c: 'text-amber-600' },
          { l: 'MRR', v: '$348', c: '' },
        ].map((s) => (
          <div key={s.l} className="min-w-0 rounded-md border border-slate-100 bg-slate-50/80 p-1">
            <p className="truncate text-[6px] text-slate-500">{s.l}</p>
            <p className={cn('truncate font-semibold text-[9px] tabular-nums', s.c)}>{s.v}</p>
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded border border-slate-100 text-[7px]">
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-1 bg-slate-50 px-1.5 py-1 font-medium text-slate-500">
          <span>ID</span>
          <span>Customer</span>
          <span>Status</span>
          <span>Amt</span>
        </div>
        {[
          { id: '#1042', s: 'Paid', t: 'green' as const, a: '$29', d: 'Ava' },
          { id: '#1041', s: 'Refund', t: 'amber' as const, a: '$19', d: 'Noah' },
          { id: '#1040', s: 'Paid', t: 'green' as const, a: '$99', d: 'Mia' },
        ].map((o) => (
          <div
            key={o.id}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-1 border-slate-50 border-t px-1.5 py-1"
          >
            <span className="font-medium tabular-nums">{o.id}</span>
            <span className="truncate text-slate-600">{o.d}</span>
            <Pill tone={o.t}>{o.s}</Pill>
            <span className="font-semibold tabular-nums">{o.a}</span>
          </div>
        ))}
      </div>
    </Shell>
  ),

  'launch-checklist': () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Launch checklist</p>
      {[
        { t: 'Domain connected', d: true },
        { t: 'Payments live', d: true },
        { t: 'Auth providers', d: true },
        { t: 'Email domain', d: false },
        { t: 'Analytics pixel', d: false },
      ].map((item) => (
        <div key={item.t} className="mb-1 flex items-center gap-1.5 text-[8px]">
          <span
            className={cn(
              'flex size-3.5 items-center justify-center rounded-full text-[7px]',
              item.d ? 'bg-emerald-500 text-white' : 'border border-slate-300',
            )}
          >
            {item.d ? '✓' : ''}
          </span>
          <span className={item.d ? 'text-slate-700' : 'text-slate-400'}>{item.t}</span>
        </div>
      ))}
      <p className="mt-auto text-[7px] text-slate-400">3 of 5 ready · 60%</p>
      <div className="h-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-3/5 rounded-full bg-blue-600" />
      </div>
    </Shell>
  ),

  'file-manager': () => (
    <Shell className="p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Files</p>
        <Pill tone="blue">Upload</Pill>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[
          { n: 'hero.png', c: 'from-sky-300 to-blue-500' },
          { n: 'logo.svg', c: 'from-violet-300 to-purple-500' },
          { n: 'deck.pdf', c: 'from-rose-300 to-red-400' },
          { n: 'shot.webp', c: 'from-emerald-300 to-teal-500' },
          { n: 'brand.ai', c: 'from-amber-300 to-orange-400' },
          { n: 'demo.mp4', c: 'from-slate-300 to-slate-500' },
        ].map((f) => (
          <div key={f.n} className="overflow-hidden rounded border border-slate-100">
            <div className={cn('h-8 bg-gradient-to-br', f.c)} />
            <p className="truncate px-0.5 py-0.5 text-[6px] text-slate-600">{f.n}</p>
          </div>
        ))}
      </div>
    </Shell>
  ),

  'email-notifications': () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Email notifications</p>
      {[
        { t: 'Welcome series', on: true },
        { t: 'Payment receipts', on: true },
        { t: 'Weekly digest', on: false },
        { t: 'Product tips', on: true },
      ].map((row) => (
        <div key={row.t} className="mb-1 flex items-center justify-between text-[8px]">
          <span>{row.t}</span>
          <div
            className={cn('h-3.5 w-6 rounded-full p-0.5', row.on ? 'bg-blue-600' : 'bg-slate-200')}
          >
            <div
              className={cn('size-2.5 rounded-full bg-white transition', row.on ? 'ml-auto' : '')}
            />
          </div>
        </div>
      ))}
    </Shell>
  ),

  'notifications-center': () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Notifications</p>
      {[
        { t: 'New payment · $29', m: '2m', tone: 'green' as const },
        { t: 'Deploy succeeded', m: '14m', tone: 'blue' as const },
        { t: 'Invite accepted', m: '1h', tone: 'violet' as const },
      ].map((n) => (
        <div key={n.t} className="mb-1 flex gap-1.5 rounded-md border border-slate-100 p-1.5">
          <Dot className={dotToneClass(n.tone, 'mt-1')} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[8px]">{n.t}</p>
            <p className="text-[7px] text-slate-400">{n.m} ago</p>
          </div>
        </div>
      ))}
    </Shell>
  ),

  'support-center': () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Support</p>
      <div className="mb-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[8px] text-slate-400">
        Search help articles…
      </div>
      <div className="space-y-1">
        {['Getting started', 'Billing & refunds', 'Connect payments', 'Invite your team'].map(
          (a) => (
            <div
              key={a}
              className="flex items-center justify-between rounded border border-slate-100 px-1.5 py-1 text-[8px]"
            >
              <span>{a}</span>
              <span className="text-slate-300">›</span>
            </div>
          ),
        )}
      </div>
    </Shell>
  ),

  integrations: () => (
    <Shell className="p-2">
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <p className="min-w-0 truncate font-semibold text-[10px]">Integrations</p>
        <Pill tone="muted">4 apps</Pill>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-1">
        {(
          [
            { n: 'Stripe', slug: 'stripe', s: 'Connected' as const },
            { n: 'Slack', slug: 'slack', s: 'Connected' as const },
            { n: 'Linear', slug: 'linear', s: 'Connect' as const },
            { n: 'Notion', slug: 'notion', s: 'Connect' as const },
          ] as const
        ).map((app) => (
          <div
            key={app.n}
            className="flex min-w-0 flex-col rounded-md border border-slate-100 bg-slate-50/50 p-1.5"
          >
            <div className="mb-1 flex size-6 items-center justify-center rounded-md border border-slate-100 bg-white shadow-sm">
              <MiniBrand className="size-3.5" slug={app.slug} />
            </div>
            <p className="truncate font-medium text-[8px] leading-tight">{app.n}</p>
            <p
              className={cn(
                'mt-0.5 truncate font-medium text-[7px] leading-none',
                app.s === 'Connected' ? 'text-emerald-600' : 'text-blue-600',
              )}
            >
              {app.s === 'Connected' ? '● Connected' : 'Connect →'}
            </p>
          </div>
        ))}
      </div>
    </Shell>
  ),

  teams: () => (
    <Shell className="p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Team</p>
        <span className="rounded bg-blue-600 px-1.5 py-0.5 font-medium text-[7px] text-white">
          Invite
        </span>
      </div>
      {[
        { n: 'Ada Lovelace', r: 'Owner', a: 'AL' },
        { n: 'Grace Hopper', r: 'Admin', a: 'GH' },
        { n: 'Alan Turing', r: 'Member', a: 'AT' },
      ].map((m) => (
        <div
          key={m.n}
          className="mb-1 flex items-center gap-1.5 rounded-md border border-slate-100 px-1.5 py-1"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-slate-100 font-semibold text-[7px]">
            {m.a}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium text-[8px]">{m.n}</span>
          <span className="text-[7px] text-slate-400">{m.r}</span>
        </div>
      ))}
    </Shell>
  ),

  analytics: () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Analytics</p>
        <Pill tone="muted">7d</Pill>
      </div>
      <div className="mb-1 grid grid-cols-3 gap-1">
        {[
          { l: 'Visitors', v: '12.4k' },
          { l: 'Signups', v: '842' },
          { l: 'Conv.', v: '3.8%' },
        ].map((s) => (
          <div key={s.l} className="rounded border border-slate-100 p-1">
            <p className="text-[6px] text-slate-500">{s.l}</p>
            <p className="font-semibold text-[10px] tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 items-end gap-0.5 rounded-md bg-slate-50 px-1 pt-2 pb-1">
        {[35, 48, 42, 60, 55, 72, 68, 80, 75, 88, 82, 95].map((h, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static bar chart heights
            key={i}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </Shell>
  ),

  'admin-panel': () => (
    <Shell className="flex-row">
      <div className="flex w-8 shrink-0 flex-col gap-1 bg-slate-900 p-1.5">
        <div className="h-1.5 w-full rounded bg-white/90" />
        <div className="h-1.5 w-full rounded bg-white/30" />
        <div className="h-1.5 w-full rounded bg-white/30" />
        <div className="mt-auto h-1.5 w-full rounded bg-white/20" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-2">
        <p className="font-semibold text-[10px]">Admin overview</p>
        <div className="grid grid-cols-2 gap-1">
          {[
            { l: 'Users', v: '4,201' },
            { l: 'Orgs', v: '318' },
            { l: 'Revenue', v: '$84k' },
            { l: 'Flags', v: '12' },
          ].map((c) => (
            <div key={c.l} className="rounded border border-slate-100 bg-slate-50 p-1">
              <p className="text-[6px] text-slate-500">{c.l}</p>
              <p className="font-semibold text-[10px]">{c.v}</p>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  ),

  'user-management': () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Users</p>
        <div className="rounded border border-slate-200 px-1.5 py-0.5 text-[7px] text-slate-400">
          Search…
        </div>
      </div>
      <div className="overflow-hidden rounded border border-slate-100 text-[7px]">
        <div className="grid grid-cols-[1fr_auto_auto] gap-1 bg-slate-50 px-1.5 py-1 font-medium text-slate-500">
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
        </div>
        {[
          ['ava@studio.io', 'Admin', 'Active'],
          ['noah@acme.co', 'Member', 'Active'],
          ['mia@beta.dev', 'Viewer', 'Invited'],
        ].map(([e, r, st]) => (
          <div
            key={e}
            className="grid grid-cols-[1fr_auto_auto] gap-1 border-slate-50 border-t px-1.5 py-1"
          >
            <span className="truncate">{e}</span>
            <span className="text-slate-500">{r}</span>
            <span className={st === 'Active' ? 'text-emerald-600' : 'text-amber-600'}>{st}</span>
          </div>
        ))}
      </div>
    </Shell>
  ),

  'audit-log': () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Audit log</p>
      {[
        { a: 'role.changed', u: 'ava@…', t: '2m' },
        { a: 'user.invited', u: 'system', t: '18m' },
        { a: 'flag.enabled', u: 'noah@…', t: '1h' },
        { a: 'billing.updated', u: 'ava@…', t: '3h' },
      ].map((row) => (
        <div key={row.a + row.t} className="mb-1 flex items-center gap-1 font-mono text-[7px]">
          <span className="text-slate-400">{row.t}</span>
          <span className="rounded bg-slate-100 px-1 text-slate-700">{row.a}</span>
          <span className="ms-auto truncate text-slate-500">{row.u}</span>
        </div>
      ))}
    </Shell>
  ),

  'billing-admin': () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Billing admin</p>
      <div className="mb-1.5 rounded-md border border-emerald-200 bg-emerald-50/60 p-1.5">
        <p className="text-[7px] text-emerald-700">MRR</p>
        <p className="font-bold text-[14px] text-emerald-800 tabular-nums">$84,220</p>
        <p className="text-[7px] text-emerald-600">+12.4% vs last month</p>
      </div>
      <div className="space-y-1 text-[8px]">
        <div className="flex justify-between">
          <span className="text-slate-500">Failed charges</span>
          <span className="font-medium text-amber-700">3</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Trials ending</span>
          <span className="font-medium">18</span>
        </div>
      </div>
    </Shell>
  ),

  'system-health': () => (
    <Shell className="p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-semibold text-[10px]">System health</p>
        <Pill tone="green">All green</Pill>
      </div>
      {[
        { n: 'API', ms: '42ms', ok: true },
        { n: 'DB', ms: '8ms', ok: true },
        { n: 'Workers', ms: 'ok', ok: true },
        { n: 'CDN', ms: '18ms', ok: true },
      ].map((s) => (
        <div key={s.n} className="mb-1 flex items-center gap-1.5 text-[8px]">
          <Dot className="bg-emerald-500" />
          <span className="font-medium">{s.n}</span>
          <span className="ms-auto text-slate-400 tabular-nums">{s.ms}</span>
        </div>
      ))}
    </Shell>
  ),

  'role-permissions': () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Roles</p>
      <div className="overflow-hidden rounded border border-slate-100 text-[7px]">
        <div className="grid grid-cols-4 gap-0.5 bg-slate-50 px-1 py-1 font-medium text-slate-500">
          <span />
          <span>Read</span>
          <span>Write</span>
          <span>Admin</span>
        </div>
        {['Owner', 'Member', 'Viewer'].map((role, ri) => (
          <div key={role} className="grid grid-cols-4 gap-0.5 border-slate-50 border-t px-1 py-1">
            <span className="font-medium">{role}</span>
            {[0, 1, 2].map((ci) => (
              <span key={ci} className="text-center">
                {ri === 0 || (ri === 1 && ci < 2) || (ri === 2 && ci === 0) ? '✓' : '·'}
              </span>
            ))}
          </div>
        ))}
      </div>
    </Shell>
  ),

  customers: () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center justify-between gap-1">
        <p className="font-semibold text-[10px]">Customers</p>
        <div className="flex items-center gap-0.5">
          <Pill tone="muted">248</Pill>
          <span className="rounded bg-blue-600 px-1.5 py-0.5 font-medium text-[6px] text-white">
            Add
          </span>
        </div>
      </div>
      <div className="mb-1 flex gap-0.5">
        <Pill tone="blue">All</Pill>
        <Pill tone="muted">Pro</Pill>
        <Pill tone="muted">Trial</Pill>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded border border-slate-100 text-[7px]">
        <div className="grid grid-cols-[1fr_auto_auto] gap-1 bg-slate-50 px-1.5 py-1 font-medium text-slate-500">
          <span>Account</span>
          <span>Plan</span>
          <span>MRR</span>
        </div>
        {[
          { n: 'Acme Labs', p: 'Pro', t: 'blue' as const, mrr: '$99' },
          { n: 'Northwind', p: 'Team', t: 'violet' as const, mrr: '$249' },
          { n: 'Bright Co', p: 'Starter', t: 'muted' as const, mrr: '$29' },
        ].map((c) => (
          <div
            key={c.n}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-1 border-slate-50 border-t px-1.5 py-1"
          >
            <div className="flex min-w-0 items-center gap-1">
              <span className="flex size-4 shrink-0 items-center justify-center rounded bg-slate-100 font-bold text-[6px]">
                {c.n[0]}
              </span>
              <span className="truncate font-medium">{c.n}</span>
            </div>
            <Pill tone={c.t}>{c.p}</Pill>
            <span className="font-semibold tabular-nums">{c.mrr}</span>
          </div>
        ))}
      </div>
    </Shell>
  ),

  'customer-detail': () => (
    <Shell className="p-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-100 font-bold text-[10px] text-indigo-700">
          A
        </span>
        <div>
          <p className="font-semibold text-[10px]">Acme Labs</p>
          <p className="text-[7px] text-slate-500">billing@acme.io · Pro</p>
        </div>
      </div>
      <div className="mb-1 grid grid-cols-3 gap-1 text-center">
        {[
          { l: 'LTV', v: '$1.2k' },
          { l: 'Seats', v: '12' },
          { l: 'NPS', v: '72' },
        ].map((s) => (
          <div key={s.l} className="rounded border border-slate-100 p-1">
            <p className="text-[6px] text-slate-500">{s.l}</p>
            <p className="font-semibold text-[9px]">{s.v}</p>
          </div>
        ))}
      </div>
      <p className="mb-0.5 font-medium text-[7px] text-slate-500">Activity</p>
      <p className="text-[7px] text-slate-600">Upgraded to Pro · 3d ago</p>
      <p className="text-[7px] text-slate-600">Invited 4 seats · 1w ago</p>
    </Shell>
  ),

  pipeline: () => (
    <Shell className="p-1.5">
      <div className="mb-1 flex items-center justify-between px-0.5">
        <p className="font-semibold text-[10px]">Pipeline</p>
        <div className="flex items-center gap-0.5">
          <Pill tone="muted">$42k</Pill>
          <Pill tone="green">4 deals</Pill>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-1">
        {[
          {
            col: 'Lead',
            n: '2',
            cards: [
              { t: 'Nova AI', v: '$8k' },
              { t: 'Pixel Co', v: '$4k' },
            ],
          },
          {
            col: 'Trial',
            n: '1',
            cards: [{ t: 'Orbit', v: '$12k' }],
          },
          {
            col: 'Won',
            n: '1',
            cards: [{ t: 'Acme', v: '$18k' }],
          },
        ].map((col) => (
          <div key={col.col} className="flex min-h-0 flex-col gap-1 rounded-md bg-slate-50 p-1">
            <div className="flex items-center justify-between">
              <p className="font-medium text-[7px] text-slate-500">{col.col}</p>
              <span className="text-[6px] text-slate-400 tabular-nums">{col.n}</span>
            </div>
            {col.cards.map((card) => (
              <div
                key={card.t}
                className="rounded border border-slate-200 bg-white px-1 py-1 shadow-sm"
              >
                <p className="truncate font-medium text-[7px]">{card.t}</p>
                <p className="text-[6px] text-slate-400 tabular-nums">{card.v}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Shell>
  ),

  'ai-assistant': () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center gap-1">
        <span className="size-4 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
        <p className="font-semibold text-[10px]">AI assistant</p>
        <Pill tone="violet">Online</Pill>
      </div>
      <div className="me-auto max-w-[88%] rounded-2xl rounded-bl-sm bg-slate-100 px-2 py-1.5">
        <p className="text-[8px]">Generate a hero image for my SaaS landing</p>
      </div>
      <div className="ms-auto max-w-[90%] rounded-2xl rounded-br-sm bg-blue-600 px-2 py-1.5 text-white">
        <p className="text-[8px]">On it — drafting 3 variants…</p>
      </div>
      <div className="me-auto mt-0.5 flex max-w-[90%] gap-1">
        {[
          'from-sky-400 to-blue-600',
          'from-violet-400 to-fuchsia-600',
          'from-amber-300 to-rose-400',
        ].map((g) => (
          <div key={g} className={cn('h-8 w-10 rounded-md bg-gradient-to-br', g)} />
        ))}
      </div>
      <div className="mt-auto flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1">
        <span className="flex-1 text-[7px] text-slate-400">Message or /generate…</span>
        <span className="size-4 rounded-full bg-blue-600" />
      </div>
    </Shell>
  ),

  search: () => (
    <Shell className="p-2">
      <div className="mb-1.5 flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/40 px-2 py-1.5 shadow-sm ring-2 ring-blue-500/15">
        <span className="text-[9px] text-slate-400">⌕</span>
        <span className="text-[9px] text-slate-800">checkout flow</span>
        <span className="ms-auto rounded bg-white/80 px-1 font-medium text-[6px] text-slate-400">
          ⌘K
        </span>
      </div>
      <p className="mb-0.5 font-semibold text-[6px] text-slate-400 uppercase tracking-wide">
        Pages
      </p>
      {[
        { t: 'Checkout page', g: 'Commerce', h: 'Pay $29 securely' },
        { t: 'Orders list', g: 'Commerce', h: 'Paid · refunds' },
      ].map((r) => (
        <div
          key={r.t}
          className="mb-1 flex items-center gap-1.5 rounded-md border border-slate-100 bg-slate-50/50 px-1.5 py-1"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[8px]">{r.t}</p>
            <p className="truncate text-[6px] text-slate-400">{r.h}</p>
          </div>
          <Pill tone="muted">{r.g}</Pill>
        </div>
      ))}
      <p className="mb-0.5 font-semibold text-[6px] text-slate-400 uppercase tracking-wide">
        Admin
      </p>
      <div className="flex items-center gap-1.5 rounded-md border border-slate-100 px-1.5 py-1">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[8px]">Billing admin</p>
          <p className="truncate text-[6px] text-slate-400">MRR · failed charges</p>
        </div>
        <Pill tone="blue">Admin</Pill>
      </div>
    </Shell>
  ),

  realtime: () => (
    <Shell className="p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Live activity</p>
        <span className="flex items-center gap-1 text-[7px] text-emerald-600">
          <Dot className="animate-pulse bg-emerald-500" /> Live
        </span>
      </div>
      {[
        { e: 'payment.succeeded', t: 'just now' },
        { e: 'user.signed_up', t: '4s' },
        { e: 'deploy.finished', t: '12s' },
        { e: 'agent.step_done', t: '21s' },
      ].map((row) => (
        <div key={row.e} className="mb-1 flex items-center gap-1 font-mono text-[7px]">
          <Dot className="bg-blue-500" />
          <span className="text-slate-700">{row.e}</span>
          <span className="ms-auto text-slate-400">{row.t}</span>
        </div>
      ))}
    </Shell>
  ),

  tasks: () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Tasks</p>
        <div className="flex items-center gap-0.5">
          <Pill tone="muted">4</Pill>
          <Pill tone="amber">2 open</Pill>
        </div>
      </div>
      <div className="mb-1 flex gap-0.5">
        <Pill tone="blue">Board</Pill>
        <Pill tone="muted">List</Pill>
      </div>
      {[
        { t: 'Wire Lemon Squeezy', d: true, p: 'Done', tone: 'green' as const },
        { t: 'Polish pricing page', d: true, p: 'Done', tone: 'green' as const },
        { t: 'Ship mobile build', d: false, p: 'High', tone: 'red' as const },
        { t: 'Record Loom demo', d: false, p: 'Med', tone: 'amber' as const },
      ].map((task) => (
        <div
          key={task.t}
          className="mb-1 flex items-center gap-1.5 rounded-md border border-slate-100 px-1.5 py-1 text-[8px]"
        >
          <span
            className={cn(
              'flex size-3.5 shrink-0 items-center justify-center rounded border text-[7px]',
              task.d ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300',
            )}
          >
            {task.d ? '✓' : ''}
          </span>
          <span
            className={cn(
              'min-w-0 flex-1 truncate',
              task.d ? 'text-slate-400 line-through' : 'text-slate-700',
            )}
          >
            {task.t}
          </span>
          <Pill tone={task.tone}>{task.p}</Pill>
        </div>
      ))}
    </Shell>
  ),

  calendar: () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold text-[10px]">March 2026</p>
        <Pill tone="blue">Today</Pill>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-[6px] text-slate-400">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static weekday labels
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[7px]">
        {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
          <span
            key={day}
            className={cn(
              'rounded py-0.5',
              day === 10 ? 'bg-blue-600 font-semibold text-white' : 'text-slate-600',
              day === 12 || day === 18 ? 'bg-blue-50 font-medium text-blue-700' : '',
            )}
          >
            {day}
          </span>
        ))}
      </div>
      <div className="mt-1 rounded border border-blue-100 bg-blue-50/50 px-1.5 py-1 text-[7px]">
        <span className="font-medium text-blue-800">10:00</span> Launch review
      </div>
    </Shell>
  ),

  blog: () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Blog</p>
        <div className="flex gap-0.5">
          <Pill tone="blue">Product</Pill>
          <Pill tone="muted">Guides</Pill>
        </div>
      </div>
      <div className="mb-1.5 h-12 rounded-md bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-700 p-1.5">
        <p className="font-medium text-[6px] text-white/60 uppercase tracking-wide">Featured</p>
        <p className="font-semibold text-[9px] text-white leading-tight">Ship like an engineer</p>
        <p className="mt-0.5 text-[6px] text-white/55">8 min · Ava Stone</p>
      </div>
      {[
        { t: 'Session one to first $', m: '4 min', tag: 'Story' },
        { t: 'Why MoR beats Stripe DIY', m: '6 min', tag: 'Payments' },
      ].map((post) => (
        <div
          key={post.t}
          className="mb-1 flex items-center gap-1.5 rounded-md border border-slate-100 px-1.5 py-1 last:mb-0"
        >
          <div className="size-6 shrink-0 rounded bg-gradient-to-br from-slate-200 to-slate-300" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-[8px] leading-tight">{post.t}</p>
            <div className="mt-0.5 flex items-center gap-1">
              <Pill tone="muted">{post.tag}</Pill>
              <span className="text-[6px] text-slate-400">{post.m}</span>
            </div>
          </div>
        </div>
      ))}
    </Shell>
  ),

  'media-gallery': () => (
    <Shell className="p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="font-semibold text-[10px]">Media</p>
        <Pill tone="violet">Generate</Pill>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[
          'from-fuchsia-400 to-pink-500',
          'from-cyan-400 to-blue-500',
          'from-lime-300 to-emerald-500',
          'from-orange-300 to-red-400',
          'from-indigo-400 to-purple-600',
          'from-yellow-300 to-amber-500',
        ].map((g) => (
          <div key={g} className={cn('aspect-square rounded-md bg-gradient-to-br', g)} />
        ))}
      </div>
    </Shell>
  ),

  docs: () => (
    <Shell className="flex-row">
      <div className="w-[70px] shrink-0 space-y-0.5 border-slate-100 border-e bg-slate-50 p-1.5">
        {['Intro', 'Auth', 'Payments', 'Deploy'].map((item, i) => (
          <div
            key={item}
            className={cn(
              'rounded px-1 py-0.5 text-[7px]',
              i === 1 ? 'bg-white font-medium text-blue-700 shadow-sm' : 'text-slate-500',
            )}
          >
            {item}
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1 p-2">
        <p className="font-semibold text-[10px]">Authentication</p>
        <p className="mt-1 text-[7px] text-slate-500 leading-snug">
          Wire OAuth providers in one skill. Google, GitHub, and magic link ship ready.
        </p>
        <div className="mt-1.5 rounded bg-slate-900 p-1.5 font-mono text-[6px] text-emerald-400">
          pnpm vybekiit auth add google
        </div>
      </div>
    </Shell>
  ),

  status: () => (
    <Shell className="p-2">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Dot className="size-2 bg-emerald-500" />
        <p className="font-semibold text-[10px]">All systems operational</p>
      </div>
      {[
        { n: 'API', u: '99.99%' },
        { n: 'Dashboard', u: '99.98%' },
        { n: 'Checkout', u: '100%' },
        { n: 'Webhooks', u: '99.95%' },
      ].map((s) => (
        <div key={s.n} className="mb-1 flex items-center gap-1.5 text-[8px]">
          <Dot className="bg-emerald-500" />
          <span>{s.n}</span>
          <span className="ms-auto text-slate-400 tabular-nums">{s.u}</span>
        </div>
      ))}
    </Shell>
  ),

  changelog: () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Changelog</p>
      {[
        { v: 'v1.4.0', n: 'Page recipes + mobile polish', d: 'Mar 8' },
        { v: 'v1.3.2', n: 'Faster checkout webhooks', d: 'Mar 1' },
        { v: 'v1.3.0', n: 'AI image generate skill', d: 'Feb 20' },
      ].map((c) => (
        <div key={c.v} className="mb-1.5 border-blue-500 border-s-2 ps-1.5">
          <div className="flex items-center gap-1">
            <Pill tone="blue">{c.v}</Pill>
            <span className="text-[7px] text-slate-400">{c.d}</span>
          </div>
          <p className="mt-0.5 text-[8px] text-slate-700">{c.n}</p>
        </div>
      ))}
    </Shell>
  ),

  safety: () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Safety & abuse</p>
      <div className="mb-1 rounded-md border border-emerald-200 bg-emerald-50/50 p-1.5">
        <p className="font-medium text-[8px] text-emerald-800">Risk score · Low</p>
        <p className="text-[7px] text-emerald-700">No open flags</p>
      </div>
      {[
        { t: 'Rate limits', s: 'On' },
        { t: 'Content filter', s: 'On' },
        { t: 'PII redaction', s: 'On' },
      ].map((r) => (
        <div key={r.t} className="mb-0.5 flex justify-between text-[8px]">
          <span>{r.t}</span>
          <span className="font-medium text-emerald-600">{r.s}</span>
        </div>
      ))}
    </Shell>
  ),

  'brand-assets': () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Brand kit</p>
      <div className="mb-1.5 flex gap-1">
        {['#2563EB', '#0F172A', '#10B981', '#F59E0B'].map((hex) => (
          <div key={hex} className="flex-1">
            <div className="mb-0.5 h-6 rounded" style={{ backgroundColor: hex }} />
            <p className="text-center font-mono text-[6px] text-slate-500">{hex}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded border border-slate-100 p-1.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-[11px] text-white">
          V
        </div>
        <div>
          <p className="font-medium text-[8px]">Logo mark</p>
          <p className="text-[7px] text-slate-400">SVG · PNG · 2x</p>
        </div>
      </div>
    </Shell>
  ),

  language: () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Language</p>
      {[
        { l: 'English', n: 'Default', on: true },
        { l: 'Español', n: 'Spanish', on: false },
        { l: 'Français', n: 'French', on: false },
        { l: '日本語', n: 'Japanese', on: false },
      ].map((lang) => (
        <div
          key={lang.l}
          className={cn(
            'mb-1 flex items-center justify-between rounded-md border px-1.5 py-1 text-[8px]',
            lang.on ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100',
          )}
        >
          <div>
            <p className="font-medium">{lang.l}</p>
            <p className="text-[7px] text-slate-400">{lang.n}</p>
          </div>
          {lang.on ? <Pill tone="blue">Active</Pill> : null}
        </div>
      ))}
    </Shell>
  ),

  'feature-flags': () => (
    <Shell className="p-2">
      <p className="mb-1.5 font-semibold text-[10px]">Feature flags</p>
      {[
        { f: 'new-checkout', on: true, p: '100%' },
        { f: 'ai-image-gen', on: true, p: '25%' },
        { f: 'mobile-v2', on: false, p: '0%' },
        { f: 'dark-mode', on: true, p: '100%' },
      ].map((flag) => (
        <div key={flag.f} className="mb-1 flex items-center gap-1.5 text-[8px]">
          <div
            className={cn(
              'h-3.5 w-6 shrink-0 rounded-full p-0.5',
              flag.on ? 'bg-emerald-500' : 'bg-slate-200',
            )}
          >
            <div className={cn('size-2.5 rounded-full bg-white', flag.on && 'ml-auto')} />
          </div>
          <span className="min-w-0 flex-1 truncate font-mono text-[7px]">{flag.f}</span>
          <span className="text-slate-400 tabular-nums">{flag.p}</span>
        </div>
      ))}
    </Shell>
  ),
};

/**
 * Realistic mini-screen body for a page recipe — unique SaaS UI per recipe id.
 *
 * @param recipe - Recipe metadata.
 * @returns Mini product UI for the recipe.
 */
const RecipeScreen = ({ recipe }: { readonly recipe: PageRecipePreview }) => {
  const render = SCREENS[recipe.id];
  if (render) {
    return <>{render()}</>;
  }

  // Fallback only if a new recipe is added without a screen
  return (
    <Shell className="p-2">
      <p className="font-semibold text-[10px]">{recipe.title}</p>
      <p className="mt-1 text-[8px] text-slate-500">{recipe.group}</p>
      <div className="mt-auto rounded-md bg-blue-600 py-1.5 text-center font-medium text-[9px] text-white">
        Open
      </div>
    </Shell>
  );
};

/**
 * CSS custom-property scatter style for a recipe card pose.
 *
 * @param pose - Stable pose numbers for the recipe id.
 * @param featured - Featured row omits fixed outer height (caption sits below).
 * @returns Inline style object for the card root.
 */
const recipeCardPoseStyle = (pose: RecipeCardPose, featured: boolean): CSSProperties =>
  ({
    zIndex: pose.zIndex,
    ...(featured ? {} : { height: pose.height }),
    '--recipe-tx': `${pose.offsetX}px`,
    '--recipe-ty': `${pose.offsetY}px`,
    '--recipe-rot': `${pose.rotate}deg`,
    '--recipe-scale': String(pose.scale),
    transform:
      'translate3d(var(--recipe-tx), var(--recipe-ty), 0) rotate(var(--recipe-rot)) scale(var(--recipe-scale))',
  }) as CSSProperties;

/**
 * Inner chrome + optional caption for a recipe card.
 *
 * @param props - Recipe, pose, featured flag, and mount visibility.
 * @returns Card body node.
 */
const RecipeCardBody = ({
  recipe,
  pose,
  featured,
  visible,
}: {
  readonly recipe: PageRecipePreview;
  readonly pose: RecipeCardPose;
  readonly featured: boolean;
  readonly visible: boolean;
}) => (
  <div className={cn('relative flex flex-col', !featured && 'h-full')}>
    {recipe.ready ? (
      <span
        className={cn(
          'absolute end-2 top-2 z-10 rounded-full border border-emerald-500/25 bg-emerald-500/95 font-semibold text-white shadow-sm',
          featured ? 'px-2 py-0.5 text-[9px] tracking-wide' : 'px-1.5 py-0.5 text-[7px]',
        )}
      >
        READY
      </span>
    ) : null}
    <div className="min-h-0" style={{ height: pose.height }}>
      <MiniBrowserChrome
        className={cn(
          'h-full shadow-md transition-shadow duration-300 hover:shadow-xl',
          featured && 'shadow-lg',
        )}
        dark={pose.darkChrome}
        url={`app.vybekiit.com${recipe.route}`}
      >
        <div className={cn('h-full min-h-0 overflow-hidden', !visible && 'bg-white')}>
          {visible ? <RecipeScreen recipe={recipe} /> : <RecipeScreenSkeleton />}
        </div>
      </MiniBrowserChrome>
    </div>
    {featured ? (
      <div className="mt-1.5 min-w-0 px-0.5">
        <p className="truncate font-semibold text-[12px] leading-tight tracking-tight">
          {recipe.title}
        </p>
        {recipe.blurb ? (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground leading-snug">
            {recipe.blurb}
          </p>
        ) : null}
      </div>
    ) : null}
  </div>
);

/**
 * One page-recipe preview card. Catalog cards lazy-mount near the viewport;
 * featured cards pass `eager` so product UI paints immediately.
 *
 * @param props - Recipe metadata, instance key, optional eager/size.
 * @returns Mini-browser card (lazy or eager).
 * @example
 * <PageRecipeCard recipe={entry} instanceKey={entry.id} eager size="featured" />
 */
export const PageRecipeCard = ({
  recipe,
  instanceKey,
  eager = false,
  size = 'compact',
}: PageRecipeCardProps) => {
  const rootRef = useRef<HTMLLIElement | null>(null);
  const [visible, setVisible] = useState(eager);
  const pose = poseForRecipe(recipe.id, size);
  const featured = size === 'featured';

  useEffect(() => {
    if (eager || visible) {
      return;
    }
    const node = rootRef.current;
    if (!node) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // Tighter margin — skeleton chrome holds layout until near-view.
      { root: null, rootMargin: '48px 40px', threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [eager, visible]);

  return (
    <li
      ref={rootRef}
      data-instance={instanceKey}
      className={cn(
        'page-recipe-card shrink-0 self-center',
        featured ? 'w-[320px] sm:w-[348px]' : 'w-[248px] sm:w-[268px]',
      )}
      style={recipeCardPoseStyle(pose, featured)}
    >
      <RecipeCardBody featured={featured} pose={pose} recipe={recipe} visible={visible} />
    </li>
  );
};
