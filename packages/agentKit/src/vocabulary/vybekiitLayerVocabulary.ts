/**
 * VybeKiit agent-layer vocabulary — kit-specific terms agents reason about.
 *
 * Rendered into each template's `language.md` via {@link renderVybekiitLayerVocabularyTable}.
 */

export type VybekiitLayerVocabularyEntry = {
  readonly jargon: string;
  readonly say: string;
  readonly why: string;
};

export const VYBEKIIT_LAYER_VOCABULARY: readonly VybekiitLayerVocabularyEntry[] = [
  {
    jargon: 'skill / buyer skill / goal skill',
    say: "the steps for this goal / what we're doing right now",
    why: 'invisible operations — never narrate skill architecture',
  },
  {
    jargon: 'update-kit / sync-agent-layer / npx skills update',
    say: 'getting the latest improvements',
    why: 'three-channel update collapsed to one plain phrase',
  },
  {
    jargon: 'verify-before-advance',
    say: 'making sure it worked before we move on',
    why: 'contract rule in plain words',
  },
  {
    jargon: 'production checklist',
    say: 'your go-live checklist',
    why: 'they may hear the filename concept — plain name only',
  },
  {
    jargon: 'decision log',
    say: 'what we decided and why',
    why: 'append-only section they never need to open',
  },
  {
    jargon: 'doc-fallback / official source fallback',
    say: "I'm checking the official setup guide",
    why: 'pairs with failure vocabulary MCP row',
  },
  {
    jargon: 'adapter / provider / interface',
    say: 'the service your app uses',
    why: 'never name the adapter pattern — outcome only',
  },
  {
    jargon: 'platform skill / goal-index / orchestration',
    say: '',
    why: 'agent-internal — never narrate Layer B architecture',
  },
  {
    jargon: 'feature readiness / extension skill / skill gap',
    say: '',
    why: 'agent-internal — never narrate gap-fill mechanics',
  },
  {
    jargon: 'session bootstrap / agentic toolchain',
    say: '',
    why: 'agent-internal — never narrate agent read order',
  },
  {
    jargon: '*-vybekiit.md (Layer B wrapper paths)',
    say: '',
    why: 'agent-internal file paths — never spoken aloud',
  },
];

const escapeCell = (text: string): string => text.replace(/\|/g, '\\|');

/**
 * Render {@link VYBEKIIT_LAYER_VOCABULARY} as a markdown table for `language.md`.
 *
 * @returns The rendered render vybekiit layer vocabulary table text.
 * @example
 * const result = renderVybekiitLayerVocabularyTable();
 */
export const renderVybekiitLayerVocabularyTable = (): string => {
  const header = "| Don't say (jargon) | Say instead (plain) | Why it matters to them |";
  const divider = '|---|---|---|';
  const rows = VYBEKIIT_LAYER_VOCABULARY.map((entry) => {
    const say = entry.say || '*(agent-internal — never say)*';
    return `| ${escapeCell(entry.jargon)} | ${escapeCell(say)} | ${escapeCell(entry.why)} |`;
  });
  return [header, divider, ...rows].join('\n');
};
