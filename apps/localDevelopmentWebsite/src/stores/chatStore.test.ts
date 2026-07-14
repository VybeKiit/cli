import { beforeEach, describe, expect, it } from 'vitest';
import { type ChatMessage, useChatStore } from './chatStore';

/** The single active conversation, asserted to exist. */
const conversation = () => {
  const found = useChatStore.getState().conversations[0];
  if (found === undefined) {
    throw new Error('expected a conversation');
  }
  return found;
};

/** The nth message of the active conversation, asserted to exist. */
const messageAt = (index: number): ChatMessage => {
  const found = conversation().messages[index];
  if (found === undefined) {
    throw new Error(`expected a message at ${index}`);
  }
  return found;
};

describe('chatStore streaming deltas', () => {
  beforeEach(() => {
    useChatStore.setState({ conversations: [] });
  });

  it('grows one agent bubble across deltas, then finalizes', () => {
    const { createConversation, appendAssistantDelta, finalizeAssistant } = useChatStore.getState();
    const created = createConversation('t', 'claude-code');

    appendAssistantDelta(created.id, 'Hel');
    appendAssistantDelta(created.id, 'lo');
    expect(conversation().messages).toHaveLength(1);
    expect(messageAt(0)).toMatchObject({ role: 'agent', content: 'Hello', streaming: true });

    finalizeAssistant(created.id);
    expect(messageAt(0).streaming).toBe(false);

    // A delta after finalize starts a fresh bubble (next turn).
    appendAssistantDelta(created.id, 'next');
    expect(conversation().messages).toHaveLength(2);
  });

  it('starts a fresh agent bubble when the last message is from the user', () => {
    const { createConversation, addMessage, appendAssistantDelta } = useChatStore.getState();
    const created = createConversation('t', 'claude-code');

    addMessage(created.id, { role: 'user', content: 'hi' });
    appendAssistantDelta(created.id, 'reply');

    expect(conversation().messages).toHaveLength(2);
    expect(messageAt(1)).toMatchObject({ role: 'agent', content: 'reply', streaming: true });
  });
});
