'use client';

import { Fragment, type ReactNode, useMemo } from 'react';

import { LogoMarkIcon } from '@/components/landing/LogoMarkIcon';
import { cn } from '@/lib/utils';

/**
 * Brand phrases (longest first) mapped to LogoMarkIcon slugs.
 * Matched case-insensitively in prose; display text keeps original casing.
 */
const BRAND_PHRASES: readonly { readonly phrase: string; readonly slug: string }[] = [
  { phrase: 'Claude Code', slug: 'claude' },
  { phrase: 'Lemon Squeezy', slug: 'lemonsqueezy' },
  { phrase: 'GitHub Copilot', slug: 'githubcopilot' },
  { phrase: 'Google Chrome', slug: 'googlechrome' },
  { phrase: 'Google Play', slug: 'googleplay' },
  { phrase: 'App Store', slug: 'appstore' },
  { phrase: 'Tailwind CSS', slug: 'tailwindcss' },
  { phrase: 'Tailwind', slug: 'tailwindcss' },
  { phrase: 'TypeScript', slug: 'typescript' },
  { phrase: 'Cloudflare', slug: 'cloudflare' },
  { phrase: 'Playwright', slug: 'playwright' },
  { phrase: 'Better Auth', slug: 'betterauth' },
  { phrase: 'shadcn/ui', slug: 'shadcn' },
  { phrase: 'shadcn', slug: 'shadcn' },
  { phrase: 'Supabase', slug: 'supabase' },
  { phrase: 'MongoDB', slug: 'mongodb' },
  { phrase: 'OpenAI', slug: 'openai' },
  { phrase: 'PayPal', slug: 'paypal' },
  { phrase: 'Stripe', slug: 'stripe' },
  { phrase: 'Resend', slug: 'resend' },
  { phrase: 'Sentry', slug: 'sentry' },
  { phrase: 'Vercel', slug: 'vercel' },
  { phrase: 'GitHub', slug: 'github' },
  { phrase: 'Claude', slug: 'claude' },
  { phrase: 'Cursor', slug: 'cursor' },
  { phrase: 'Codex', slug: 'codex' },
  { phrase: 'Kiro', slug: 'kiro' },
  { phrase: 'React', slug: 'react' },
  { phrase: 'Expo', slug: 'expo' },
  { phrase: 'Next.js', slug: 'nextdotjs' },
  { phrase: 'Node.js', slug: 'nodedotjs' },
  { phrase: 'AWS', slug: 'amazonaws' },
  { phrase: 'Plausible', slug: 'plausible' },
  { phrase: 'Figma', slug: 'figma' },
  { phrase: 'Grok', slug: 'grok' },
  { phrase: 'Windsurf', slug: 'windsurf' },
  { phrase: 'Devin', slug: 'devin' },
  { phrase: 'Replit', slug: 'replit' },
  { phrase: 'JetBrains', slug: 'jetbrains' },
];

const ESCAPED_PHRASES = BRAND_PHRASES.map((entry) =>
  entry.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
);

/** Built once: longest-phrase-first alternation for brand names in prose. */
// Example: "Claude Code, Cursor" → matches Claude Code then Cursor (word-bounded)
const BRAND_REGEX = new RegExp(`\\b(${ESCAPED_PHRASES.join('|')})\\b`, 'gi');

const SLUG_BY_LOWER = new Map(
  BRAND_PHRASES.map((entry) => [entry.phrase.toLowerCase(), entry.slug] as const),
);

type BrandSegment =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'brand'; readonly value: string; readonly slug: string };

/**
 * Split plain copy into text and brand segments for logo injection.
 *
 * @param text - Source string (FAQ answers, footnotes, etc.).
 * @returns Ordered segments preserving original casing.
 * @example
 * splitBrandText('Use Claude Code or Cursor')
 * // → text + brand(claude) + text + brand(cursor)
 */
export const splitBrandText = (text: string): readonly BrandSegment[] => {
  if (text.length === 0) {
    return [];
  }

  const segments: BrandSegment[] = [];
  let lastIndex = 0;
  BRAND_REGEX.lastIndex = 0;

  for (const match of text.matchAll(BRAND_REGEX)) {
    const value = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      // Keep "and " glued to the following brand so it does not drop to a
      // lower baseline on its own line when the FAQ question wraps.
      // "…Codex, and Kiro" → text "…Codex, " + brand "and Kiro" is wrong;
      // instead turn trailing " and " into a non-breaking " and\u00A0".
      let plain = text.slice(lastIndex, index);
      if (plain.endsWith(' and ')) {
        plain = `${plain.slice(0, -5)} and\u00A0`;
      } else if (plain.endsWith('and ')) {
        plain = `${plain.slice(0, -4)}and\u00A0`;
      }
      segments.push({ kind: 'text', value: plain });
    }
    const slug = SLUG_BY_LOWER.get(value.toLowerCase());
    if (slug === undefined) {
      segments.push({ kind: 'text', value });
    } else {
      segments.push({ kind: 'brand', value, slug });
    }
    lastIndex = index + value.length;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  return segments;
};

interface BrandRichTextProps {
  readonly text: string;
  readonly className?: string;
  /** Extra classes for the small logo next to each brand name. */
  readonly iconClassName?: string;
  /** When true, force mono SVG silhouettes (dark bands). */
  readonly mono?: boolean;
  /** Wrapper element — default span so it nests inside p/h3 safely. */
  readonly as?: 'span' | 'p';
}

/**
 * Renders plain marketing copy with official brand logos beside known product names.
 *
 * @param props - Text and presentation options.
 * @returns Inline-rich text with LogoMarkIcon chips.
 * @example
 * <BrandRichText text="Works with Claude Code, Cursor, and Codex." />
 */
export const BrandRichText = ({
  text,
  className,
  iconClassName,
  mono = false,
  as: Tag = 'span',
}: BrandRichTextProps) => {
  const segments = useMemo(() => splitBrandText(text), [text]);

  const nodes: ReactNode[] = segments.map((segment, index) => {
    if (segment.kind === 'text') {
      return <Fragment key={`t-${index}`}>{segment.value}</Fragment>;
    }

    return (
      <span className="brand-inline" key={`b-${index}-${segment.slug}`}>
        <LogoMarkIcon
          className={cn('brand-inline__icon', iconClassName)}
          mono={mono}
          slug={segment.slug}
        />
        <span>{segment.value}</span>
      </span>
    );
  });

  return <Tag className={className}>{nodes}</Tag>;
};
