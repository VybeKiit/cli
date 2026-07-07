/**
 * People and identity vocabulary — who the vibe coder is and who they are not.
 *
 * Rendered into each template's `language.md` via {@link renderPeopleVocabularyTable}.
 */

export type PeopleVocabularyEntry = {
  readonly jargon: string;
  readonly say: string;
  readonly why: string;
};

/** Rows where `say` is empty mean agent-internal or never-say aloud. */
export const PEOPLE_VOCABULARY: readonly PeopleVocabularyEntry[] = [
  {
    jargon: 'builder (legacy)',
    say: 'you / the vibe coder',
    why: 'builder is deprecated — vibe coder is the canonical identity',
  },
  {
    jargon: 'buyer (commerce)',
    say: 'you',
    why: 'purchase/legal identity only — never narrate commerce jargon to the vibe coder',
  },
  {
    jargon: 'vibe coder',
    say: 'you',
    why: 'canonical buyer-facing identity when addressing them directly',
  },
  {
    jargon: 'developer / engineer / programmer / coder',
    say: '',
    why: 'never frame the vibe coder as a developer — describe product outcomes instead',
  },
  {
    jargon: 'software engineer',
    say: '',
    why: 'competitor framing — VybeKiit serves vibe coders, not engineers',
  },
];

const escapeCell = (text: string): string => text.replace(/\|/g, '\\|');

/**
 * Render {@link PEOPLE_VOCABULARY} as a markdown table for `language.md`.
 *
 * @returns The rendered render people vocabulary table text.
 * @example
 * const result = renderPeopleVocabularyTable();
 */
export const renderPeopleVocabularyTable = (): string => {
  const header = "| Don't say (jargon) | Say instead (plain) | Why it matters to them |";
  const divider = '|---|---|---|';
  const rows = PEOPLE_VOCABULARY.map((entry) => {
    const say = entry.say || '*(agent-internal — never say)*';
    return `| ${escapeCell(entry.jargon)} | ${escapeCell(say)} | ${escapeCell(entry.why)} |`;
  });
  return [header, divider, ...rows].join('\n');
};
