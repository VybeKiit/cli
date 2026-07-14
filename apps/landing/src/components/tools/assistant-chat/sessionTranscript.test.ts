import { Effect } from 'effect';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSessionTranscript } from './sessionTranscript';

afterEach(() => vi.unstubAllGlobals());

const readFailureCode = async (transcriptEffect: ReturnType<typeof loadSessionTranscript>) => {
  const transcriptEither = await Effect.runPromise(Effect.either(transcriptEffect));
  if (transcriptEither._tag === 'Right') {
    throw new Error('Expected transcript loading to fail.');
  }
  return transcriptEither.left.code;
};

describe('loadSessionTranscript', () => {
  it('loads a decoded session transcript', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          Response.json({
            ok: true,
            messages: [{ role: 'user', text: 'Build the checkout.' }],
            title: 'Checkout',
          }),
        ),
      ),
    );

    const transcript = await Effect.runPromise(
      loadSessionTranscript('session-1', 'claude', new AbortController().signal),
    );

    expect(transcript).toEqual({
      messages: [{ role: 'user', text: 'Build the checkout.' }],
      title: 'Checkout',
    });
  });

  it('fails with request_failed for a non-success response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ ok: false }, { status: 500 }))),
    );

    const failureCode = await readFailureCode(
      loadSessionTranscript('session-1', 'claude', new AbortController().signal),
    );

    expect(failureCode).toBe('request_failed');
  });

  it('fails with invalid_response when the response shape is malformed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({ ok: true }))),
    );

    const failureCode = await readFailureCode(
      loadSessionTranscript('session-1', 'claude', new AbortController().signal),
    );

    expect(failureCode).toBe('invalid_response');
  });

  it('fails with aborted when a newer session cancels the request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string | URL | Request, requestInit?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            requestInit?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      ),
    );
    const requestController = new AbortController();
    const transcriptEffect = loadSessionTranscript(
      'old-session',
      'claude',
      requestController.signal,
    );

    const failureCodePromise = readFailureCode(transcriptEffect);
    requestController.abort();

    await expect(failureCodePromise).resolves.toBe('aborted');
  });
});
