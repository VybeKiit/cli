import {
  parseWorkerSendBody,
  senderDomain,
  toWorkerSendBody,
} from '@vybekiit/email/cloudflare/workerContract';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';

describe('worker-contract', () => {
  it('round-trips SendEmailParams through JSON', () => {
    const body = toWorkerSendBody({
      to: 'a@b.com',
      from: 'hello@vybekiit.com',
      subject: 'Hi',
      html: '<p>Hi</p>',
      text: 'Hi',
    });
    expect(Effect.runSync(parseWorkerSendBody(body))).toEqual(body);
  });

  it('rejects incomplete bodies', () => {
    expect(() => Effect.runSync(parseWorkerSendBody({ to: 'a@b.com' }))).toThrow();
  });

  it('extracts sender domain', () => {
    expect(senderDomain('hello@vybekiit.com')).toBe('vybekiit.com');
  });
});
