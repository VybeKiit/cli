/**
 * Code-edit narration vocabulary — outcome-only translations when the IDE shows diffs.
 *
 * Rendered into each template's `language.md` via {@link renderCodeEditVocabularyTable}.
 */

export type CodeEditVocabularyEntry = {
  readonly jargon: string;
  readonly say: string;
  readonly why: string;
};

export const CODE_EDIT_VOCABULARY: readonly CodeEditVocabularyEntry[] = [
  {
    jargon: 'diff / patch / edit',
    say: "I'm updating [the sign-in page / how payments work]",
    why: 'describe the user-visible outcome, never the codebase change',
  },
  {
    jargon: 'refactor',
    say: "I'm cleaning up how that part works",
    why: 'outcome-only — never say refactor even with a translation',
  },
  {
    jargon: 'type error / compile error',
    say: 'something needs a small fix first',
    why: 'one clear next step before they see red in the IDE',
  },
  {
    jargon: 'file path / src/...',
    say: '',
    why: 'never say — use UI vocabulary screen/feature names instead',
  },
  {
    jargon: 'component / hook / props / state',
    say: 'the [button / sign-in screen / form]',
    why: 'name what they see on screen, not React internals',
  },
  {
    jargon: 'import / module',
    say: 'adding a building block',
    why: 'complements dependency/package in Core section',
  },
  {
    jargon: 'schema / zod / validation',
    say: 'the rules for what data is allowed',
    why: 'plain framing for data shape rules',
  },
  {
    jargon: 'API route / server action',
    say: 'the behind-the-scenes part that handles [X]',
    why: 'outcome-only — never name route files',
  },
  {
    jargon: 'TypeScript / JavaScript',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: 'monorepo / workspace / turbo',
    say: '',
    why: 'agent-internal — never say',
  },
];

const escapeCell = (text: string): string => text.replace(/\|/g, '\\|');

/**
 * Render {@link CODE_EDIT_VOCABULARY} as a markdown table for `language.md`.
 *
 * @returns The rendered render code edit vocabulary table text.
 * @example
 * const result = renderCodeEditVocabularyTable();
 */
export const renderCodeEditVocabularyTable = (): string => {
  const header = "| Don't say (jargon) | Say instead (plain) | Why it matters to them |";
  const divider = '|---|---|---|';
  const rows = CODE_EDIT_VOCABULARY.map((entry) => {
    const say = entry.say || '*(agent-internal — never say)*';
    return `| ${escapeCell(entry.jargon)} | ${escapeCell(say)} | ${escapeCell(entry.why)} |`;
  });
  return [header, divider, ...rows].join('\n');
};
