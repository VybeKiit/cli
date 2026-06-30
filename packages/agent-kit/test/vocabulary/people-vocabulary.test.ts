import { describe, expect, it } from 'vitest';
import {
  PEOPLE_VOCABULARY,
  renderPeopleVocabularyTable,
} from '../../src/vocabulary/people-vocabulary';

describe('renderPeopleVocabularyTable', () => {
  const lines = renderPeopleVocabularyTable().split('\n');

  it('emits a header + divider then one row per entry', () => {
    expect(lines[0]).toBe("| Don't say (jargon) | Say instead (plain) | Why it matters to them |");
    expect(lines[1]).toBe('|---|---|---|');
    expect(lines).toHaveLength(PEOPLE_VOCABULARY.length + 2);
  });

  it('marks engineer identity terms as agent-internal', () => {
    const table = renderPeopleVocabularyTable();
    expect(table).toContain(
      '| developer / engineer / programmer / coder | *(agent-internal — never say)* |',
    );
    expect(table).toContain('| software engineer | *(agent-internal — never say)* |');
  });
});
