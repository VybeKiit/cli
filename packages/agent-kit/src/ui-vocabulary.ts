/**
 * UI, product-surface, and failure vocabulary — plain language for non-technical builders.
 *
 * Rendered into each template's `language.md` via {@link renderUiVocabularyTable} and
 * {@link renderAgentInternalVocabularyTable} (DRY with {@link sdlc-vocabulary.ts}).
 */

export interface UiVocabularyEntry {
  readonly jargon: string;
  readonly say: string;
  readonly why: string;
}

/** Layout, hosting, analytics, and AI-surface terms the builder may point at or overhear. */
export const UI_VOCABULARY: readonly UiVocabularyEntry[] = [
  {
    jargon: 'navbar / header / top nav',
    say: 'the top menu',
    why: 'matches what they see at the top of the screen',
  },
  {
    jargon: 'sidebar / side nav',
    say: 'the side menu',
    why: 'matches what they see along the side',
  },
  {
    jargon: 'admin dashboard / dashboard',
    say: 'your dashboard / signed-in area',
    why: 'the part only logged-in users see',
  },
  {
    jargon: 'cloud / hosting / serverless',
    say: "your app's home online",
    why: 'where the live app runs — never name the provider',
  },
  {
    jargon: 'analytics',
    say: 'visitor stats',
    why: 'who uses the app without analytics jargon',
  },
  {
    jargon: 'SEO',
    say: 'how search engines find you',
    why: 'discoverability in plain words',
  },
  {
    jargon: 'GEO / JSON-LD / structured data',
    say: 'extra details search engines read',
    why: 'structured metadata without crawler jargon',
  },
  {
    jargon: 'streaming (AI)',
    say: 'the reply appears word by word',
    why: 'explains live AI text without "streaming"',
  },
  {
    jargon: 'chat with AI / AI chat',
    say: 'talk to the assistant inside your app',
    why: 'in-app AI without product names',
  },
  {
    jargon: 'sign in / log in',
    say: 'sign in',
    why: 'explicit row — complements "authentication / auth"',
  },
  {
    jargon: 'deeplink / URI scheme',
    say: 'I sent that to your assistant',
    why: 'Report Mode handoff — never expose URL schemes',
  },
  {
    jargon: 'Report mode / inspect mode',
    say: "point at what's wrong",
    why: 'only if they ask about the hotkey overlay',
  },
];

/** Failure and doctor-adjacent terms — extends the doctor skill voice. */
export const FAILURE_VOCABULARY: readonly UiVocabularyEntry[] = [
  {
    jargon: 'bug',
    say: "something isn't working right",
    why: 'plain framing before the fix',
  },
  {
    jargon: 'error / exception',
    say: "something went wrong — here's the one fix",
    why: 'one clear next step, never a wall of red',
  },
  {
    jargon: 'not working / broken',
    say: "something broke — I'll figure it out",
    why: 'routes to doctor without debug vocabulary',
  },
];

/** Engineering internals the builder must never hear. */
export const AGENT_INTERNAL_VOCABULARY: readonly UiVocabularyEntry[] = [
  {
    jargon: 'middleware',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: 'idempotency',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: 'race condition',
    say: '',
    why: 'agent-internal — never say',
  },
];

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

function renderVocabularyTable(entries: readonly UiVocabularyEntry[]): string {
  const header = "| Don't say (jargon) | Say instead (plain) | Why it matters to them |";
  const divider = '|---|---|---|';
  const rows = entries.map((entry) => {
    const say = entry.say || '*(agent-internal — never say)*';
    return `| ${escapeCell(entry.jargon)} | ${escapeCell(say)} | ${escapeCell(entry.why)} |`;
  });
  return [header, divider, ...rows].join('\n');
}

/** Render layout + product surface rows for `language.md` → "Your app's layout". */
export function renderUiVocabularyTable(): string {
  return renderVocabularyTable(UI_VOCABULARY);
}

/** Render failure rows for `language.md` → "When something breaks". */
export function renderFailureVocabularyTable(): string {
  return renderVocabularyTable(FAILURE_VOCABULARY);
}

/** Render agent-internal rows for `language.md` → "Agent-internal — never say". */
export function renderAgentInternalVocabularyTable(): string {
  return renderVocabularyTable(AGENT_INTERNAL_VOCABULARY);
}
