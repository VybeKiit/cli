import {
  AGENT_INTERNAL_VOCABULARY,
  FAILURE_VOCABULARY,
  renderAgentInternalVocabularyTable,
  renderFailureVocabularyTable,
  renderUiVocabularyTable,
  UI_VOCABULARY,
} from '@vybekiit/agentKit/vocabulary/uiVocabulary';
import { describe, expect, it } from 'vitest';

describe('renderUiVocabularyTable', () => {
  const lines = renderUiVocabularyTable().split('\n');

  it('emits a header + divider then one row per entry', () => {
    expect(lines[0]).toBe("| Don't say (jargon) | Say instead (plain) | Why it matters to them |");
    expect(lines[1]).toBe('|---|---|---|');
    expect(lines).toHaveLength(UI_VOCABULARY.length + 2);
  });

  it('translates navbar without jargon', () => {
    expect(renderUiVocabularyTable()).toContain('| navbar / header / top nav | the top menu |');
  });

  it('translates Report mode for builders who ask', () => {
    expect(renderUiVocabularyTable()).toContain(
      "| Report mode / inspect mode | point at what's wrong |",
    );
  });
});

describe('renderFailureVocabularyTable', () => {
  it('covers doctor-adjacent failure terms', () => {
    const table = renderFailureVocabularyTable();
    expect(table).toContain("| not working / broken | something broke — I'll figure it out |");
    expect(table).toContain(
      "| 401 / unauthorized / not signed in | you'll need to sign in first — I'll walk you through it |",
    );
    expect(table.split('\n')).toHaveLength(FAILURE_VOCABULARY.length + 2);
  });
});

describe('renderAgentInternalVocabularyTable', () => {
  it('marks middleware and idempotency as agent-internal', () => {
    const table = renderAgentInternalVocabularyTable();
    expect(table).toContain('| middleware | *(agent-internal — never say)* |');
    expect(table).toContain('| idempotency | *(agent-internal — never say)* |');
    expect(table.split('\n')).toHaveLength(AGENT_INTERNAL_VOCABULARY.length + 2);
  });
});
