import { describe, expect, it } from 'vitest';
import {
  VYBEKIIT_LAYER_VOCABULARY,
  renderVybekiitLayerVocabularyTable,
} from '../../src/vocabulary/vybekiit-layer-vocabulary';

describe('renderVybekiitLayerVocabularyTable', () => {
  const lines = renderVybekiitLayerVocabularyTable().split('\n');

  it('emits a header + divider then one row per entry', () => {
    expect(lines[0]).toBe("| Don't say (jargon) | Say instead (plain) | Why it matters to them |");
    expect(lines[1]).toBe('|---|---|---|');
    expect(lines).toHaveLength(VYBEKIIT_LAYER_VOCABULARY.length + 2);
  });

  it('translates verify-before-advance to plain words', () => {
    const table = renderVybekiitLayerVocabularyTable();
    expect(table).toContain('making sure it worked before we move on');
  });
});
