import type { FeedbackDraft } from '@vybekiit/agent-kit';
import { describe, expect, it, vi } from 'vitest';

import { createFeedbackIntakeClient } from './feedbackClient';

const unsafeDraft: FeedbackDraft = {
  kind: 'bug',
  buyerMessage: 'Token ghp_123456789012345678901234567890123456 failed.',
  agentSummary: 'Checkout failed.',
  reproductionSteps: ['Choose a plan'],
  template: 'web',
  trigger: 'explicit',
  diagnostics: {
    agent: 'claude-code',
    agentVersion: '2.1.207',
    kitVersion: '0.7.1',
    operatingSystem: 'macOS',
  },
};

describe('feedback intake client', () => {
  it('submits a redacted draft with a bearer intake session', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(
      async (_input, _init) =>
        await Promise.resolve(
          new Response(JSON.stringify({ reference: 'FB-01JTEST' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
    );
    const client = createFeedbackIntakeClient({ baseUrl: 'http://localhost:3000/api', fetch });

    await expect(client.submit({ session: 'session-token', draft: unsafeDraft })).resolves.toEqual({
      reference: 'FB-01JTEST',
    });
    const request = fetch.mock.calls[0]?.[1];
    expect(request?.headers).toEqual({
      authorization: 'Bearer session-token',
      'content-type': 'application/json',
    });
    expect(request?.body).not.toContain('ghp_');
  });
});
