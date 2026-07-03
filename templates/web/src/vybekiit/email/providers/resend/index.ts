import { type ResendConfig, type Result, fail, ok } from '@vybekiit/core';
import { decodeResendSendResponse } from '../../../http/responseSchemas';
import type { EmailProvider, SendEmailParams } from '../../types';

export function createResendEmail(config: ResendConfig): EmailProvider {
  return {
    name: 'resend',
    async send(params: SendEmailParams): Promise<Result<{ id: string }>> {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: params.from,
          to: [params.to],
          subject: params.subject,
          html: params.html,
          ...(params.text ? { text: params.text } : {}),
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        return fail('email_send_failed', detail || `Resend returned ${res.status}`);
      }
      const json = decodeResendSendResponse(await res.json());
      if (!json?.id) {
        return fail('email_send_failed', 'Resend did not return a message id.');
      }
      return ok({ id: json.id });
    },
  };
}
