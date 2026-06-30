/**
 * The canonical buyer-skill contract — the seven rules that define how every
 * VybeKiit template agent behaves toward a non-technical builder.
 *
 * Why this lives here (not only in each template's `AGENTS.md`): the contract is
 * the *shared* spine of the agent layer. Every template's `AGENTS.md` ships the
 * same seven promises ("Decide + Guide"); keeping the wording in one typed source
 * lets skills, docs, and tests reference it without drifting. The prose mirrors
 * what already ships in `templates/web/AGENTS.md` so this stays the description,
 * not a second definition.
 */

/**
 * One rule of the buyer-skill contract.
 *
 * `id` is the stable 1-based position used to reference a rule (e.g. rule ③);
 * `title` is the short imperative name; `summary` is the one-line plain-language
 * statement of the promise as it appears to the builder.
 */
export interface ContractRule {
  readonly id: number;
  readonly title: string;
  readonly summary: string;
}

/**
 * The full buyer-skill contract: a heading and its seven ordered rules.
 *
 * This is the single source of truth for the contract's wording. The order is
 * load-bearing — rules are referenced by their 1-based {@link ContractRule.id}.
 */
export interface Contract {
  readonly heading: string;
  readonly rules: readonly ContractRule[];
}

/**
 * The canonical seven-rule contract every template agent follows.
 *
 * Sourced from the "Decide + Guide" / "How to work" sections of
 * `templates/web/AGENTS.md` so it matches what ships to the buyer.
 */
export const CONTRACT: Contract = {
  heading: 'The contract: Decide + Guide',
  rules: [
    {
      id: 1,
      title: 'One action at a time',
      summary:
        'Do a single step, then stop — never hand the builder a wall of instructions to run at once.',
    },
    {
      id: 2,
      title: 'Verify before advancing',
      summary:
        "Confirm each step actually worked before moving on, so the builder can't get silently stuck.",
    },
    {
      id: 3,
      title: 'Plain language',
      summary:
        'Translate every technical term using language.md — the builder never has to understand or decide.',
    },
    {
      id: 4,
      title: 'Translate errors',
      summary:
        'Turn any failure into "what happened + the one thing to do about it" — never paste a raw stack trace.',
    },
    {
      id: 5,
      title: 'Celebrate progress',
      summary:
        'Call out small wins out loud ("Payments are working! 🎉") to keep a non-coder going.',
    },
    {
      id: 6,
      title: 'Record decisions',
      summary:
        'After every completing skill, append one entry to checklist.md Decision log via formatChecklistEntry().',
    },
    {
      id: 7,
      title: 'Official source fallback',
      summary:
        'If MCP or the first debug attempt fails once, run vybekiit doc-fallback and tell the builder the plain stuck phrase only.',
    },
  ],
};

/** Map a rule id (1-7) to its circled-number glyph for readable rendering. */
const CIRCLED_DIGITS = ['①', '②', '③', '④', '⑤', '⑥', '⑦'] as const;

/**
 * Render {@link CONTRACT} as a markdown section a skill or doc can drop inline.
 *
 * Produces an `##` heading followed by a numbered list (circled digits, matching
 * how the contract is referenced in prose). Pure string-building so the rendered
 * form has one source — callers never reassemble the rules by hand.
 */
export function renderContract(): string {
  const lines = [`## ${CONTRACT.heading}`, ''];
  for (const rule of CONTRACT.rules) {
    const glyph = CIRCLED_DIGITS[rule.id - 1] ?? `${rule.id}.`;
    lines.push(`${glyph} **${rule.title}** — ${rule.summary}`);
  }
  return lines.join('\n');
}
