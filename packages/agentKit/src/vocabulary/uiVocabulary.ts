/**
 * UI, product-surface, and failure vocabulary — plain language for non-technical builders.
 *
 * Rendered into each template's `language.md` via {@link renderUiVocabularyTable} and
 * {@link renderAgentInternalVocabularyTable} (DRY with {@link sdlc-vocabulary.ts}).
 */

export type UiVocabularyEntry = {
  readonly jargon: string;
  readonly say: string;
  readonly why: string;
};

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
  {
    jargon: 'MCP connection failed / tool error',
    say: "I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment.",
    why: 'never say MCP; run vybekiit doc-fallback then follow official docs',
  },
  {
    jargon: '400 / bad input / bad request',
    say: "something's missing or mistyped — I'll fix the form or the data we're sending",
    why: 'client-side fix framing without HTTP jargon',
  },
  {
    jargon: '401 / unauthorized / not signed in',
    say: "you'll need to sign in first — I'll walk you through it",
    why: 'routes to add-signin without status codes',
  },
  {
    jargon: '403 / forbidden',
    say: "that action isn't allowed from here — I'll fix the setup",
    why: 'origin or permission block in plain words',
  },
  {
    jargon: '404 / not found',
    say: "I couldn't find that — I'll check the link or data",
    why: 'missing resource without HTTP jargon',
  },
  {
    jargon: '409 / conflict',
    say: "that already exists — I'll adjust what we're saving",
    why: 'duplicate or version clash',
  },
  {
    jargon: '422 / validation error',
    say: "something in the form needs a quick fix — I'll point at it",
    why: 'field-level validation without schema jargon',
  },
  {
    jargon: '429 / too many requests / rate limit',
    say: "too many tries too fast — wait a moment and I'll retry",
    why: 'rate limit without Retry-After jargon',
  },
  {
    jargon: '500 / server error',
    say: "something went wrong on our side — I'll fix it and try again",
    why: 'server fault without stack traces',
  },
  {
    jargon: '502 / upstream failed',
    say: "the payment service hiccuped — I'll retry or switch to practice mode",
    why: 'provider outage with a next step',
  },
  {
    jargon: '503 / service unavailable',
    say: "that service is briefly down — I'll retry in a moment",
    why: 'temporary outage without availability jargon',
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
  {
    jargon: 'DOM / CSS selector / element selector',
    say: '',
    why: 'agent-internal — say "what you clicked" or "location in code" in the handoff only',
  },
  {
    jargon: 'sandbox',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: 'ask mode / agent mode',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: 'skills CLI / skills.sh',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: '*-vybekiit.md (Layer B wrapper paths)',
    say: '',
    why: 'agent-internal file paths — never spoken aloud',
  },
  {
    jargon: 'JWT / JWKS',
    say: '',
    why: 'agent-internal — never say',
  },
];

const escapeCell = (text: string): string => text.replace(/\|/g, '\\|');

const renderVocabularyTable = (entries: readonly UiVocabularyEntry[]): string => {
  const header = "| Don't say (jargon) | Say instead (plain) | Why it matters to them |";
  const divider = '|---|---|---|';
  const rows = entries.map((entry) => {
    const say = entry.say || '*(agent-internal — never say)*';
    return `| ${escapeCell(entry.jargon)} | ${escapeCell(say)} | ${escapeCell(entry.why)} |`;
  });
  return [header, divider, ...rows].join('\n');
};

/**
 * Render layout + product surface rows for `language.md` → "Your app's layout".
 *
 * @returns The rendered render ui vocabulary table text.
 * @example
 * const result = renderUiVocabularyTable();
 */
export const renderUiVocabularyTable = (): string => renderVocabularyTable(UI_VOCABULARY);

/**
 * Render failure rows for `language.md` → "When something breaks".
 *
 * @returns The rendered render failure vocabulary table text.
 * @example
 * const result = renderFailureVocabularyTable();
 */
export const renderFailureVocabularyTable = (): string => renderVocabularyTable(FAILURE_VOCABULARY);

/**
 * Render agent-internal rows for `language.md` → "Agent-internal — never say".
 *
 * @returns The rendered render agent internal vocabulary table text.
 * @example
 * const result = renderAgentInternalVocabularyTable();
 */
export const renderAgentInternalVocabularyTable = (): string =>
  renderVocabularyTable(AGENT_INTERNAL_VOCABULARY);
