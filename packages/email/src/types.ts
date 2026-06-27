import type { Result } from '@vybekiit/core';

/**
 * The email backends VybeKiit ships an adapter for. One runs at a time (chosen via
 * `EMAIL_PROVIDER`); the agent swaps by changing that one env value, because senders
 * talk to the {@link EmailProvider} interface rather than a specific vendor.
 * Cloudflare is the v1 default; `ses` and `resend` ship later (ADR-0002).
 */
export type EmailProviderName = 'cloudflare' | 'ses' | 'resend';

/**
 * One transactional email, normalized across providers. `html` is the rendered body
 * every adapter requires; `text` is an optional plain-text fallback for clients that
 * won't render HTML. All fields are readonly — params describe a send, they aren't a
 * mutable buffer.
 */
export interface SendEmailParams {
  /** Recipient address. */
  readonly to: string;
  /** Verified sender address. */
  readonly from: string;
  /** Subject line. */
  readonly subject: string;
  /** Rendered HTML body. */
  readonly html: string;
  /** Optional plain-text fallback body. */
  readonly text?: string;
}

/**
 * The swappable email seam. Each adapter is constructed from its own validated
 * config (credentials/endpoint live in the factory), so `send` is credential-free at
 * the call site and uniform across vendors. Returns a {@link Result} so an expected
 * boundary failure (rejected address, transport error) is branched on, not thrown;
 * `value.id` is the provider's message id for later lookup.
 */
export interface EmailProvider {
  /** Which vendor this instance sends through. */
  readonly name: EmailProviderName;
  /** Send one email and return the provider's message id. */
  send(params: SendEmailParams): Promise<Result<{ id: string }>>;
}
