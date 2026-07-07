import { Schema } from 'effect';

const NonEmptyString = Schema.String.pipe(Schema.minLength(1));

const UrlString = Schema.String.pipe(
  Schema.filter((value) => URL.canParse(value), { message: () => 'must be a valid URL' }),
);

// one @, a dot in the domain, no spaces: "a@b.co" -> match, "a@b" / "a b@c.co" -> no match
const EMAIL_ADDRESS_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const EmailString = Schema.String.pipe(
  Schema.filter((value) => EMAIL_ADDRESS_PATTERN.test(value), {
    message: () => 'must be a valid email',
  }),
);

/** Supported email adapter keys decoded from `EMAIL_PROVIDER`. */
export const EmailProviderName = Schema.Literal('cloudflare', 'ses', 'resend');

/** Static type inferred from {@link EmailProviderName}. */
export type EmailProviderNameType = Schema.Schema.Type<typeof EmailProviderName>;

/** Email provider selector config. */
export const EmailConfig = Schema.Struct({
  EMAIL_PROVIDER: Schema.optionalWith(EmailProviderName, {
    default: () => 'cloudflare' as const,
  }),
});

/** Static type inferred from {@link EmailConfig}. */
export type EmailConfigType = Schema.Schema.Type<typeof EmailConfig>;

/** Cloudflare email worker credentials. */
export const CloudflareEmailConfig = Schema.Struct({
  EMAIL_WORKER_SECRET: NonEmptyString,
  CLOUDFLARE_EMAIL_ENDPOINT: UrlString,
  EMAIL_FROM: Schema.optional(EmailString),
  EMAIL_FROM_NAME: Schema.optional(NonEmptyString),
});

/** Static type inferred from {@link CloudflareEmailConfig}. */
export type CloudflareEmailConfigType = Schema.Schema.Type<typeof CloudflareEmailConfig>;

/** Amazon SES credentials for transactional email delivery. */
export const SesEmailConfig = Schema.Struct({
  AWS_REGION: NonEmptyString,
  AWS_ACCESS_KEY_ID: Schema.optional(NonEmptyString),
  AWS_SECRET_ACCESS_KEY: Schema.optional(NonEmptyString),
});

/** Static type inferred from {@link SesEmailConfig}. */
export type SesEmailConfigType = Schema.Schema.Type<typeof SesEmailConfig>;

/** Resend API credentials for transactional email delivery. */
export const ResendEmailConfig = Schema.Struct({
  RESEND_API_KEY: NonEmptyString,
});

/** Static type inferred from {@link ResendEmailConfig}. */
export type ResendEmailConfigType = Schema.Schema.Type<typeof ResendEmailConfig>;
