/** Builder assistants shown in the pricing checkout terminal TUI. */
export type VibeCoderAssistant = 'cursor' | 'claude' | 'codex';

export const VIBE_CODER_ASSISTANT_LABELS: Record<VibeCoderAssistant, string> = {
  cursor: 'Cursor',
  claude: 'Claude Code',
  codex: 'Codex',
};

export type VibeCoderPromptSegment =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'icon'; readonly slug: string }
  | { readonly kind: 'cmd'; readonly text: string };

export interface VibeCoderPromptEntry {
  readonly assistant: VibeCoderAssistant;
  readonly segments: readonly VibeCoderPromptSegment[];
  /** Screen-reader + typewriter source (text/cmd only). */
  readonly typeable: string;
  /** Full plain sentence including brand names. */
  readonly plain: string;
}

const BRAND_LABELS: Record<string, string> = {
  google: 'Google',
  lemonsqueezy: 'Lemon Squeezy',
  stripe: 'Stripe',
  supabase: 'Supabase',
  cloudflare: 'Cloudflare',
  appstore: 'the App Store',
  googlechrome: 'Chrome',
  paypal: 'PayPal',
  resend: 'Resend',
  expo: 'Expo',
};

const labelForIcon = (slug: string): string => {
  const label = BRAND_LABELS[slug];
  return label === undefined ? slug : label;
};

const buildPrompt = (
  assistant: VibeCoderAssistant,
  segments: readonly VibeCoderPromptSegment[],
): VibeCoderPromptEntry => {
  const typeable = segments
    .filter((segment) => segment.kind !== 'icon')
    .map((segment) => segment.text)
    .join('');
  const plain = segments
    .map((segment) => {
      if (segment.kind === 'icon') {
        return labelForIcon(segment.slug);
      }
      return segment.text;
    })
    .join('');

  return { assistant, segments, typeable, plain };
};

/**
 * Goal-named prompts in plain vibe-coder language (see LANGUAGE.md).
 * Icons appear inline once the preceding text finishes typing.
 */
export const VIBE_CODER_PROMPTS: readonly VibeCoderPromptEntry[] = [
  buildPrompt('cursor', [
    { kind: 'text', text: 'turn on my cash register with ' },
    { kind: 'icon', slug: 'lemonsqueezy' },
    { kind: 'text', text: ' so people can pay me' },
  ]),
  buildPrompt('claude', [
    { kind: 'text', text: 'let people sign in with ' },
    { kind: 'icon', slug: 'google' },
  ]),
  buildPrompt('codex', [
    { kind: 'text', text: 'get my app on ' },
    { kind: 'icon', slug: 'appstore' },
    { kind: 'text', text: ' for iPhone buyers' },
  ]),
  buildPrompt('cursor', [
    { kind: 'text', text: "checkout is broken — people can't finish paying" },
  ]),
  buildPrompt('claude', [
    { kind: 'text', text: 'save my customer info online with ' },
    { kind: 'icon', slug: 'supabase' },
  ]),
  buildPrompt('codex', [{ kind: 'text', text: "show me how much money I'm making this week" }]),
  buildPrompt('cursor', [
    { kind: 'text', text: 'put my website live on the internet with ' },
    { kind: 'icon', slug: 'cloudflare' },
  ]),
  buildPrompt('claude', [{ kind: 'text', text: 'walk me through my go-live checklist' }]),
  buildPrompt('codex', [
    { kind: 'text', text: 'add the little ' },
    { kind: 'icon', slug: 'googlechrome' },
    { kind: 'text', text: ' popup for my app' },
  ]),
  buildPrompt('cursor', [
    { kind: 'text', text: 'make the pricing page look like this screenshot' },
  ]),
  buildPrompt('claude', [{ kind: 'text', text: 'get the latest kit improvements' }]),
  buildPrompt('codex', [
    { kind: 'cmd', text: 'ls' },
    { kind: 'text', text: ' — what did we already ship?' },
  ]),
  buildPrompt('cursor', [
    { kind: 'text', text: 'let people pay with ' },
    { kind: 'icon', slug: 'paypal' },
    { kind: 'text', text: ' too' },
  ]),
  buildPrompt('claude', [
    { kind: 'text', text: 'send a welcome email with ' },
    { kind: 'icon', slug: 'resend' },
    { kind: 'text', text: ' when someone signs up' },
  ]),
  buildPrompt('codex', [{ kind: 'text', text: 'add a dark mode switch in settings' }]),
  buildPrompt('cursor', [
    { kind: 'text', text: 'take card payments with ' },
    { kind: 'icon', slug: 'stripe' },
  ]),
  buildPrompt('claude', [
    { kind: 'text', text: 'ship my phone app build through ' },
    { kind: 'icon', slug: 'expo' },
  ]),
  buildPrompt('codex', [
    { kind: 'cmd', text: 'ls apps/landing' },
    { kind: 'text', text: ' — show me the landing files' },
  ]),
];
