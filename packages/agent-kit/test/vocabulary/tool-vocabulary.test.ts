import { describe, expect, it } from 'vitest';
import { TOOL_VOCABULARY, renderToolVocabularyTable } from '../../src/vocabulary/tool-vocabulary';

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

  it('never escapes-away an embedded pipe (cells stay valid)', () => {
    for (const row of lines.slice(2)) {
      expect(row.startsWith('| ')).toBe(true);
      expect(row.endsWith(' |')).toBe(true);
    }
  });
});
