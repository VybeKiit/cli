import { describe, expect, it } from 'vitest';
import {
  parseWorkerSendBody,
  senderDomain,
  toWorkerSendBody,
} from '../src/cloudflare/worker-contract';

describe('worker-contract', () => {
  it('round-trips SendEmailParams through JSON', () => {
    const body = toWorkerSendBody({
      to: 'a@b.com',
      from: 'hello@vybekiit.com',
      subject: 'Hi',
      html: '<p>Hi</p>',
      text: 'Hi',
    });
    expect(parseWorkerSendBody(body)).toEqual(body);
  });

  it('rejects incomplete bodies', () => {
    expect(() => parseWorkerSendBody({ to: 'a@b.com' })).toThrow(/Missing required/);
  });

  it('extracts sender domain', () => {
    expect(senderDomain('hello@vybekiit.com')).toBe('vybekiit.com');
  });
});
