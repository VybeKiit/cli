/// <reference types="@cloudflare/workers-types" />

import { type CloudflareWorkerSendBody, parseWorkerSendBody, senderDomain } from './workerContract';

export interface EmailWorkerEnv {
  EMAIL: SendEmail;
  EMAIL_WORKER_SECRET: string;
  DEFAULT_FROM_EMAIL: string;
  DEFAULT_FROM_NAME: string;
  ALLOWED_SENDER_DOMAINS: string;
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...JSON_HEADERS, ...(init.headers ?? {}) },
  });
}

function allowedDomains(env: EmailWorkerEnv): string[] {
  return env.ALLOWED_SENDER_DOMAINS.split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function verifyBearer(request: Request, env: EmailWorkerEnv): Response | null {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!env.EMAIL_WORKER_SECRET || token !== env.EMAIL_WORKER_SECRET) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

function parseFromAddress(from: string, env: EmailWorkerEnv): { email: string; name: string } {
  const match = from.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1]!.trim(), email: match[2]!.trim() };
  }
  return { email: from, name: env.DEFAULT_FROM_NAME };
}

export function createEmailWorkerHandler(): ExportedHandler<EmailWorkerEnv> {
  return {
    async fetch(request: Request, env: EmailWorkerEnv): Promise<Response> {
      const url = new URL(request.url);

      if (request.method === 'GET' && url.pathname.endsWith('/health')) {
        return json({ ok: true, name: 'vybekiit-email' });
      }

      if (request.method !== 'POST' || !url.pathname.endsWith('/send')) {
        return json({ error: 'Not found' }, { status: 404 });
      }

      const authFailure = verifyBearer(request, env);
      if (authFailure) {
        return authFailure;
      }

      let parsed: unknown;
      try {
        parsed = await request.json();
      } catch {
        return json({ error: 'Invalid JSON' }, { status: 400 });
      }

      let body: CloudflareWorkerSendBody;
      try {
        body = parseWorkerSendBody(parsed);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid body';
        return json({ error: message }, { status: 400 });
      }

      const from = parseFromAddress(body.from || env.DEFAULT_FROM_EMAIL, env);
      const allowed = allowedDomains(env);
      const domain = senderDomain(from.email);
      if (!(domain && allowed.includes(domain))) {
        return json(
          { error: `From address must use an allowed domain: ${allowed.join(', ')}` },
          { status: 400 },
        );
      }

      try {
        await env.EMAIL.send({
          from: { email: from.email, name: from.name },
          to: body.to,
          subject: body.subject,
          html: body.html,
          ...(body.text ? { text: body.text } : {}),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Send failed';
        console.error(JSON.stringify({ event: 'email.failed', error: message }));
        return json({ error: message }, { status: 502 });
      }

      const id = `${Date.now()}@${domain}`;
      console.log(
        JSON.stringify({
          event: 'email.sent',
          from: from.email,
          to: body.to,
          subject: body.subject,
        }),
      );
      return json({ id });
    },
  };
}
