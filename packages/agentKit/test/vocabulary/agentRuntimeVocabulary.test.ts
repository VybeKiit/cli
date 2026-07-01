import { describe, expect, it } from 'vitest';
import {
  AGENT_RUNTIME_VOCABULARY,
  renderAgentRuntimeVocabularyTable,
} from '../../src/vocabulary/agentRuntimeVocabulary';

describe('renderAgentRuntimeVocabularyTable', () => {
  const lines = renderAgentRuntimeVocabularyTable().split('\n');

  it('emits a header + divider then one row per entry', () => {
    expect(lines[0]).toBe("| Don't say (jargon) | Say instead (plain) | Why it matters to them |");
    expect(lines[1]).toBe('|---|---|---|');
    expect(lines).toHaveLength(AGENT_RUNTIME_VOCABULARY.length + 2);
  });

  it('names the Allow button for permission prompts', () => {
    const table = renderAgentRuntimeVocabularyTable();
    expect(table).toContain('click **Allow**');
  });
});
