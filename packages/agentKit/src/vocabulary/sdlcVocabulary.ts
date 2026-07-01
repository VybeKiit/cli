/**
 * SDLC / quality / git vocabulary — plain language for non-technical builders.
 *
 * Rendered into each template's `language.md` → "Quality and saving your work"
 * via {@link renderSdlcVocabularyTable} (DRY with {@link tool-vocabulary.ts}).
 */

export interface SdlcVocabularyEntry {
  readonly jargon: string;
  readonly say: string;
  readonly why: string;
}

/** Rows where `say` is empty mean agent-internal — never speak the jargon aloud. */
export const SDLC_VOCABULARY: readonly SdlcVocabularyEntry[] = [
  {
    jargon: 'test / unit test',
    say: 'I checked it still works',
    why: 'reassures them without test-suite vocabulary',
  },
  {
    jargon: 'TDD / tests-first',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: 'linter / formatter / Biome',
    say: 'tidying the code',
    why: 'usually invisible; only mention if they ask why you paused',
  },
  {
    jargon: 'quality smoke / typecheck',
    say: 'everything checks out',
    why: 'onboarding and pre-ship reassurance',
  },
  {
    jargon: 'pull request / PR',
    say: 'a safe copy for the checker to review',
    why: 'when saving via branch before merge',
  },
  {
    jargon: 'CI / GitHub Actions',
    say: 'the automatic checker online',
    why: 'never name GitHub Actions',
  },
  {
    jargon: 'CD / deploy pipeline',
    say: 'putting updates online automatically',
    why: 'only if they overhear pipeline talk',
  },
  {
    jargon: 'Playwright / E2E / headless browser',
    say: 'I walked through your app like a visitor would',
    why: 'UI walkthrough without tool names',
  },
  {
    jargon: 'back up / save progress online',
    say: 'I saved your progress online',
    why: 'never say GitHub — stays in service ban list',
  },
  {
    jargon: 'worktree',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: 'husky / hook / pre-push',
    say: '',
    why: 'agent-internal — never say',
  },
];

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

/** Render {@link SDLC_VOCABULARY} as a markdown table for `language.md`. */
export function renderSdlcVocabularyTable(): string {
  const header = "| Don't say (jargon) | Say instead (plain) | Why it matters to them |";
  const divider = '|---|---|---|';
  const rows = SDLC_VOCABULARY.map((entry) => {
    const say = entry.say || '*(agent-internal — never say)*';
    return `| ${escapeCell(entry.jargon)} | ${escapeCell(say)} | ${escapeCell(entry.why)} |`;
  });
  return [header, divider, ...rows].join('\n');
}
