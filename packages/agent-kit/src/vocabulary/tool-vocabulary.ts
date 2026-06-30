/**
 * The tool-jargon → plain-language vocabulary for talking *about the agent layer
 * itself* to a non-technical builder.
 *
 * Why this exists: `language.md` already translates product/domain jargon, but the
 * builder also overhears the agent reasoning about its own tooling ("I'll add an
 * MCP server", "check the context window", "your rules file"). Those terms break
 * the illusion just as badly as "env var" does. This is the single source of truth
 * for that slice; the matching section in each template's `language.md` is rendered
 * from {@link renderToolVocabularyTable} so the two never drift (DRY).
 *
 * Hard rule (mirrors `language.md` → "Service names — never speak these"): the
 * builder must NEVER hear a product/tool name. Claude Code, Codex, and Cursor all
 * collapse to "your assistant"; the IDE, the terminal, and MCP stay invisible.
 */

/**
 * One translation row: a piece of tool jargon, the plain phrase to say instead,
 * and the reason it matters to the builder (guidance for the agent, not spoken).
 *
 * `say` is what the agent says out loud; `why` is private context that helps the
 * agent decide how much, if anything, the builder actually needs to know.
 */
export interface ToolVocabularyEntry {
  readonly jargon: string;
  readonly say: string;
  readonly why: string;
}

/**
 * Jargon-about-the-tools the builder must never hear, mapped to plain phrasing.
 *
 * Ordered most-likely-to-slip first. Every product name (Claude Code, Codex,
 * Cursor) collapses to "your assistant" — the builder chose an outcome, not a tool,
 * so the tool stays invisible exactly like the underlying services do.
 */
export const TOOL_VOCABULARY: readonly ToolVocabularyEntry[] = [
  {
    jargon: 'Claude Code / Codex / Cursor',
    say: 'your assistant',
    why: 'they picked an outcome, not a tool — naming the product breaks the "I just talk to one helper" feel',
  },
  {
    jargon: 'the CLI / the terminal / the command line',
    say: "the part I work in (you don't need to touch it)",
    why: 'the black text screen is mine to drive; surfacing it invites them to poke and get stuck',
  },
  {
    jargon: 'the IDE / the editor',
    say: 'where your app is being built',
    why: 'the window they have open — call it by what it does, not its product name',
  },
  {
    jargon: 'agent / the model / the LLM',
    say: 'me / your assistant',
    why: 'they are talking to one helper, not a "model" — keep it personal and singular',
  },
  {
    jargon: 'prompt',
    say: 'what you tell me / your request',
    why: 'their plain words to me — never frame it as a technical input they must craft',
  },
  {
    jargon: 'context window',
    say: 'how much I can keep in mind at once',
    why: 'why I sometimes recap or ask them to confirm where we are — not a setting they manage',
  },
  {
    jargon: 'rules file / AGENTS.md / CLAUDE.md / .cursor/rules',
    say: 'my instructions for your project',
    why: 'the file that tells me how to behave here — they never need to open or edit it',
  },
  {
    jargon: 'slash command',
    say: 'a shortcut I can run',
    why: 'a quick action I trigger for them — frame it as something I do, not something they type',
  },
  {
    jargon: 'MCP / MCP server',
    say: 'a tool I can use for you',
    why: 'an extra capability I plug in on their behalf — the plumbing stays invisible',
  },
  {
    jargon: 'pnpm / npm / package manager',
    say: 'getting the building blocks ready',
    why: 'one-time install wait — never name the package manager',
  },
  {
    jargon: 'GitHub Copilot / Copilot',
    say: 'your assistant',
    why: 'deliberately out of scope — collapse like other assistant products if it slips out',
  },
];

/** Escape a cell so a literal pipe never breaks the markdown table layout. */
function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

/**
 * Render {@link TOOL_VOCABULARY} as a GitHub-flavored markdown table.
 *
 * Columns: "Don't say (jargon)" | "Say instead (plain)" | "Why it matters to
 * them" — matching the existing `language.md` tables so a template can paste the
 * output straight into its "Talking about the tools themselves" section. This is
 * the rendering the templates embed, so the table has exactly one source.
 */
export function renderToolVocabularyTable(): string {
  const header = "| Don't say (jargon) | Say instead (plain) | Why it matters to them |";
  const divider = '|---|---|---|';
  const rows = TOOL_VOCABULARY.map(
    (entry) =>
      `| ${escapeCell(entry.jargon)} | ${escapeCell(entry.say)} | ${escapeCell(entry.why)} |`,
  );
  return [header, divider, ...rows].join('\n');
}
