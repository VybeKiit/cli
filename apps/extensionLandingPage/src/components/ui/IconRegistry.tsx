import {
  Bolt,
  Bookmark,
  Github,
  LineChart,
  Lock,
  MousePointerClick,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Twitter,
  Zap,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import type { IconKey } from '@/data/landingContent';

/**
 * Discord glyph — not shipped by lucide, so inlined at this vendor brand seam
 * (same pattern as the app-store brand SVGs) and drawn with `currentColor`.
 *
 * @param props - Standard SVG props (className, sizing) forwarded to the svg.
 * @returns The Discord logo path.
 * @example
 * <DiscordIcon className="h-4 w-4" />
 */
export const DiscordIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127c-.598.35-1.22.645-1.873.891a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.42 2.157-2.42 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.42 2.157-2.42 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" />
  </svg>
);

/** Maps a data `IconKey` to a lucide (or inlined) icon component. */
const ICONS = {
  zap: Zap,
  shield: ShieldCheck,
  mousePointerClick: MousePointerClick,
  sparkles: Sparkles,
  store: Store,
  rocket: Rocket,
  bookmark: Bookmark,
  bolt: Bolt,
  lineChart: LineChart,
  settings: Settings,
  lock: Lock,
  twitter: Twitter,
  github: Github,
  discord: DiscordIcon,
} satisfies Record<IconKey, ComponentType<SVGProps<SVGSVGElement>>>;

/**
 * Resolve a data-driven icon key to its icon component.
 *
 * @param key - The `IconKey` stored on a content data record.
 * @returns The matching icon component (lucide or inlined brand glyph).
 * @example
 * const Icon = resolveIcon('zap');
 * return <Icon className="h-4 w-4" />;
 */
export const resolveIcon = (key: IconKey): ComponentType<SVGProps<SVGSVGElement>> => ICONS[key];
