// biome-ignore-all lint/style/noExcessiveClassesPerFile: Effect error and service tag classes intentionally live with the email service contract.
import type { EmailProviderNameType } from '@vybekiit/email/config';
import { Context, Data, type Effect, Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

/** One transactional email, normalized before provider delivery. */
export const SendEmailParams = Schema.Struct({
  to: NonEmptyString,
  from: NonEmptyString,
  subject: NonEmptyString,
  html: NonEmptyString,
  text: Schema.optional(Schema.String),
});

/** Static type inferred from {@link SendEmailParams}. */
export type SendEmailParamsType = Schema.Schema.Type<typeof SendEmailParams>;

/** Backward-compatible send parameter type alias during the Schema migration. */
export type SendEmailParams = SendEmailParamsType;

/** Provider message id returned after a successful send. */
export const SendEmailResult = Schema.Struct({
  id: NonEmptyString,
});

/** Static type inferred from {@link SendEmailResult}. */
export type SendEmailResultType = Schema.Schema.Type<typeof SendEmailResult>;

/** Expected email failures that callers may recover from. */
export class EmailError extends Data.TaggedError('EmailError')<{
  readonly code:
    | 'EMAIL_CONFIG_INVALID'
    | 'EMAIL_PROVIDER_UNSUPPORTED'
    | 'EMAIL_SEND_FAILED'
    | 'EMAIL_INVALID_RESPONSE';
  readonly message: string;
}> {}

/** Effect service contract for transactional email delivery. */
export type EmailService = {
  readonly name: EmailProviderNameType;
  readonly send: (params: SendEmailParamsType) => Effect.Effect<SendEmailResultType, EmailError>;
};

/** Injectable email service tag used by composition roots and tests. */
export class Email extends Context.Tag('@vybekiit/email/Email')<Email, EmailService>() {}

/** Backward-compatible alias for the email service shape during the Effect migration. */
export type EmailProvider = EmailService;

/** Backward-compatible alias for send parameters during the Effect migration. */
export type SendEmailParamsAlias = SendEmailParamsType;
