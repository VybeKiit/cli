import { describe, expect, it } from 'vitest';
import type { ClientMessage, DaemonMessage } from './contract';

describe('daemon wire contract', () => {
  it('accepts every browser-to-daemon message', () => {
    const sendMessage = {
      type: 'agent.send',
      agent: 'claude-code',
      content: 'Build the dashboard.',
    } satisfies ClientMessage;
    const stopMessage = { type: 'agent.stop' } satisfies ClientMessage;

    expect([sendMessage.type, stopMessage.type]).toEqual(['agent.send', 'agent.stop']);
  });

  it('preserves optional session ids on daemon messages', () => {
    const outputMessage = {
      type: 'agent.output',
      chunk: 'working',
      sessionId: 'session-1',
    } satisfies DaemonMessage;
    const statusMessage = {
      type: 'agent.status',
      status: 'idle',
    } satisfies DaemonMessage;

    expect(outputMessage.sessionId).toBe('session-1');
    expect(statusMessage.status).toBe('idle');
  });

  it('emits no runtime contract exports', async () => {
    const contractRuntime = await import('./contract');

    expect(Object.keys(contractRuntime)).toEqual([]);
  });
});
