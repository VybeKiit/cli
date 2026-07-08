/**
 * Claude Code / Cursor runtime vocabulary — mechanics agents narrate out loud.
 *
 * Rendered into each template's `language.md` via {@link renderAgentRuntimeVocabularyTable}.
 */

export type AgentRuntimeVocabularyEntry = {
  readonly jargon: string;
  readonly say: string;
  readonly why: string;
};

export const AGENT_RUNTIME_VOCABULARY: readonly AgentRuntimeVocabularyEntry[] = [
  {
    jargon: 'subagent / background agent / Task',
    say: "I'm looking into that part now",
    why: 'never say parallel/background — outcome-only',
  },
  {
    jargon: 'thinking / extended thinking',
    say: 'give me a moment to figure this out',
    why: 'visible reasoning stays invisible',
  },
  {
    jargon: 'plan mode',
    say: 'let me map this out before we build',
    why: 'only if they ask why you are not coding yet',
  },
  {
    jargon: 'ask mode / agent mode',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: 'tool call / function calling',
    say: "I'm checking something for you",
    why: 'mechanism stays invisible',
  },
  {
    jargon: 'approve / permission / allow once',
    say: "your assistant needs you to click **Allow** — that's normal",
    why: 'the one moment we name the UI button, not the mechanism',
  },
  {
    jargon: 'compaction / summarizing context',
    say: "I'm catching up on where we are",
    why: 'if they notice a pause after a long session',
  },
  {
    jargon: 'memory / memories',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: 'Composer',
    say: 'your assistant',
    why: 'Cursor product name — collapse like Claude Code',
  },
  {
    jargon: 'skills CLI / skills.sh',
    say: '',
    why: 'agent-internal — never say',
  },
  {
    jargon: 'sandbox',
    say: '',
    why: 'agent-internal — no useful plain phrase',
  },
];

const escapeCell = (text: string): string => text.replace(/\|/g, '\\|');

/**
 * Render {@link AGENT_RUNTIME_VOCABULARY} as a markdown table for `language.md`.
 *
 * @returns The rendered render agent runtime vocabulary table text.
 * @example
 * const result = renderAgentRuntimeVocabularyTable();
 */
export const renderAgentRuntimeVocabularyTable = (): string => {
  const header = "| Don't say (jargon) | Say instead (plain) | Why it matters to them |";
  const divider = '|---|---|---|';
  const rows = AGENT_RUNTIME_VOCABULARY.map((entry) => {
    const say = entry.say || '*(agent-internal — never say)*';
    return `| ${escapeCell(entry.jargon)} | ${escapeCell(say)} | ${escapeCell(entry.why)} |`;
  });
  return [header, divider, ...rows].join('\n');
};
