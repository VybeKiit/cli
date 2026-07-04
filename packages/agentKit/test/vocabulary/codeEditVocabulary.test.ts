import {
  CODE_EDIT_VOCABULARY,
  renderCodeEditVocabularyTable,
} from '@vybekiit/agentKit/vocabulary/codeEditVocabulary';
import { describe, expect, it } from 'vitest';

describe('renderCodeEditVocabularyTable', () => {
  const lines = renderCodeEditVocabularyTable().split('\n');

  it('emits a header + divider then one row per entry', () => {
    expect(lines[0]).toBe("| Don't say (jargon) | Say instead (plain) | Why it matters to them |");
    expect(lines[1]).toBe('|---|---|---|');
    expect(lines).toHaveLength(CODE_EDIT_VOCABULARY.length + 2);
  });

  it('translates diff/refactor to outcome-only phrases', () => {
    const table = renderCodeEditVocabularyTable();
    expect(table).toContain("I'm updating [the sign-in page / how payments work]");
    expect(table).toContain("I'm cleaning up how that part works");
  });
});
