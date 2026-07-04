import {
  renderToolVocabularyTable,
  TOOL_VOCABULARY,
} from '@vybekiit/agentKit/vocabulary/toolVocabulary';
import { describe, expect, it } from 'vitest';

describe('renderToolVocabularyTable', () => {
  const lines = renderToolVocabularyTable().split('\n');

  it('emits a header + divider then one row per entry', () => {
    expect(lines[0]).toBe("| Don't say (jargon) | Say instead (plain) | Why it matters to them |");
    expect(lines[1]).toBe('|---|---|---|');
    expect(lines).toHaveLength(TOOL_VOCABULARY.length + 2);
  });

  it('collapses every assistant product name to "your assistant"', () => {
    const table = renderToolVocabularyTable();
    expect(table).toContain('| Claude Code / Codex / Cursor | your assistant |');
  });

  it('translates MCP without naming the plumbing', () => {
    const table = renderToolVocabularyTable();
    expect(table).toContain('| MCP / MCP server | a tool I can use for you |');
  });

  it('translates package manager without naming pnpm', () => {
    const table = renderToolVocabularyTable();
    expect(table).toContain('| pnpm / npm / package manager | getting the building blocks ready |');
  });

  it('never escapes-away an embedded pipe (cells stay valid)', () => {
    for (const row of lines.slice(2)) {
      expect(row.startsWith('| ')).toBe(true);
      expect(row.endsWith(' |')).toBe(true);
    }
  });
});
