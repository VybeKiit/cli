import type { VybeAssistant } from '@vybekiit/report-mode';
import type { ResumeListItem, StoredConversation } from './conversationStore';

export interface SessionConversationInput {
  readonly assistant: VybeAssistant;
  readonly title: string;
  readonly preview: string;
  readonly terminalSessionId: string;
  readonly cwd?: string;
  readonly sourcePath?: string;
}

export interface SessionTranscriptSelection {
  readonly terminalSessionId: string;
  readonly ensureBridge: boolean;
  readonly cwd?: string;
  readonly sourcePath?: string;
}

export type SessionSelection =
  | { readonly ok: false; readonly message: string }
  | {
      readonly ok: true;
      readonly assistant: VybeAssistant;
      readonly conversation:
        | { readonly kind: 'existing'; readonly row: StoredConversation }
        | { readonly kind: 'create'; readonly input: SessionConversationInput };
      readonly refreshConversations: boolean;
      readonly transcript?: SessionTranscriptSelection;
    };

const nonEmpty = (value: string | undefined): value is string =>
  typeof value === 'string' && value.length > 0;

const transcriptSelection = (
  row: ResumeListItem | StoredConversation,
  terminalSessionId: string,
  ensureBridge: boolean,
): SessionTranscriptSelection => ({
  terminalSessionId,
  ensureBridge,
  ...(nonEmpty(row.cwd) ? { cwd: row.cwd } : {}),
  ...(nonEmpty(row.sourcePath) ? { sourcePath: row.sourcePath } : {}),
});

/** Decide how a saved or native CLI conversation should open in the panel. */
export const planSessionSelection = (
  row: ResumeListItem | StoredConversation,
  savedConversations: readonly StoredConversation[],
  assistantStreamsInPanel: boolean,
): SessionSelection => {
  const source = 'source' in row ? row.source : 'saved';
  if (source === 'cli') {
    const { terminalSessionId } = row;
    if (!nonEmpty(terminalSessionId)) {
      return {
        ok: false,
        message: 'This CLI session is missing an id — open a new chat instead.',
      };
    }
    const existingConversation = savedConversations.find(
      (savedConversation) =>
        savedConversation.terminalSessionId === terminalSessionId &&
        savedConversation.assistant === row.assistant,
    );
    let plannedConversation: Extract<SessionSelection, { readonly ok: true }>['conversation'];
    if (existingConversation) {
      plannedConversation = { kind: 'existing', row: existingConversation };
    } else {
      plannedConversation = {
        kind: 'create',
        input: {
          assistant: row.assistant,
          title: row.title,
          preview: row.preview,
          terminalSessionId,
          ...(nonEmpty(row.cwd) ? { cwd: row.cwd } : {}),
          ...(nonEmpty(row.sourcePath) ? { sourcePath: row.sourcePath } : {}),
        },
      };
    }
    return {
      ok: true,
      assistant: row.assistant,
      conversation: plannedConversation,
      refreshConversations: true,
      transcript: transcriptSelection(row, terminalSessionId, assistantStreamsInPanel),
    };
  }

  const { terminalSessionId } = row;
  const savedSelection = {
    ok: true as const,
    assistant: row.assistant,
    conversation: { kind: 'existing' as const, row },
    refreshConversations: false,
  };
  if (!assistantStreamsInPanel) {
    return savedSelection;
  }
  if (!nonEmpty(terminalSessionId)) {
    return savedSelection;
  }
  return {
    ...savedSelection,
    transcript: transcriptSelection(row, terminalSessionId, false),
  };
};
