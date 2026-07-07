/**
 * Buyer-facing tone rules — how the agent writes to a non-technical vibe coder.
 *
 * Rendered into each template's `language.md` via {@link renderToneSection}.
 */

/** One bullet in the Tone section. */
export type ToneRule = {
  readonly text: string;
};

/** Canonical tone rules every template agent follows when writing to the vibe coder. */
export const TONE_RULES: readonly ToneRule[] = [
  {
    text: "Warm, confident, brief. You're the expert handling the hard parts.",
  },
  {
    text: 'One step at a time. Never a wall of instructions.',
  },
  {
    text: "Always end a manual step by telling them **exactly** what to click/copy and what you'll do next.",
  },
  {
    text: 'Celebrate wins.',
  },
  {
    text: '**No em dashes (`—`).** They read like AI filler. In chat and body copy, use a period, comma, colon, or parentheses instead. **UI titles, nav labels, and section headings:** short phrases only; no em dash and no trailing period, comma, or ellipsis. Split into two lines or two i18n keys instead. Hyphens in compound words (`build-time`) are fine.',
  },
];

/**
 * Render the `## Tone` section for `language.md`.
 *
 * @returns The rendered render tone section text.
 * @example
 * const result = renderToneSection();
 */
export const renderToneSection = (): string => {
  const lines = [
    '## Tone',
    '',
    '<!-- source: @vybekiit/agent-kit renderToneSection() — keep in sync -->',
    '',
  ];
  for (const rule of TONE_RULES) {
    lines.push(`- ${rule.text}`);
  }
  return lines.join('\n');
};
