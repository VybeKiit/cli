import { describe, expect, it } from 'vitest';
import { SDLC_VOCABULARY, renderSdlcVocabularyTable } from '../../src/vocabulary/sdlc-vocabulary';

describe('renderSdlcVocabularyTable', () => {
  const lines = renderSdlcVocabularyTable().split('\n');

  it('emits a header + divider then one row per entry', () => {
    expect(lines[0]).toBe("| Don't say (jargon) | Say instead (plain) | Why it matters to them |");
    expect(lines[1]).toBe('|---|---|---|');
    expect(lines).toHaveLength(SDLC_VOCABULARY.length + 2);
  });

  it('translates tests without jargon', () => {
    expect(renderSdlcVocabularyTable()).toContain(
      '| test / unit test | I checked it still works |',
    );
  });

  it('marks agent-internal rows', () => {
    expect(renderSdlcVocabularyTable()).toContain(
      '| husky / hook / pre-push | *(agent-internal — never say)* |',
    );
  });
});
