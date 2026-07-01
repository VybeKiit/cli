import type { SendEmailParams } from '../types';

/** JSON body for `POST /send` on the Cloudflare email worker — matches {@link SendEmailParams}. */
export interface CloudflareWorkerSendBody {
  readonly to: string;
  readonly from: string;
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
}

/** Successful send response from the email worker. */
export interface CloudflareWorkerSendResponse {
  readonly id: string;
}

export function toWorkerSendBody(params: SendEmailParams): CloudflareWorkerSendBody {
  return {
    to: params.to,
    from: params.from,
    subject: params.subject,
    html: params.html,
    ...(params.text ? { text: params.text } : {}),
  };
}

export function parseWorkerSendBody(raw: unknown): CloudflareWorkerSendBody {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Body must be a JSON object');
  }
  const body = raw as Record<string, unknown>;
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const from = typeof body.from === 'string' ? body.from.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const html = typeof body.html === 'string' ? body.html : '';
  const text = typeof body.text === 'string' ? body.text : undefined;
  if (!(to && from && subject && html)) {
    throw new Error('Missing required fields: to, from, subject, html');
  }
  return { to, from, subject, html, ...(text ? { text } : {}) };
}

export function senderDomain(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}
