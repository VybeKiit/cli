import process from 'node:process';
import { type EnvSource, parseEnv } from '@vybekiit/core';
import {
  CloudflareEmailConfig,
  EmailConfig,
  type EmailConfigType,
  type EmailProviderNameType,
  ResendEmailConfig,
  SesEmailConfig,
} from '@vybekiit/email/config';
import { createCloudflareEmail, type FetchLike } from '@vybekiit/email/providers/cloudflare';
import { createResendEmail } from '@vybekiit/email/providers/resend';
import { createSesEmail } from '@vybekiit/email/providers/ses';
import {
  Email,
  type EmailError,
  type EmailProvider,
  type SendEmailParamsType,
  type SendEmailResultType,
} from '@vybekiit/email/types';
import { Effect, Layer, type Schema } from 'effect';
import { caughtMessage, emailError, failEmail, tryEmail } from './emailEffect';

type EmailProviderFactory = (
  source: EnvSource,
  fetchImpl: FetchLike | undefined,
) => Effect.Effect<EmailProvider, EmailError>;

const emailProviderFactories = {
  cloudflare: (source, fetchImpl) =>
    parseEmailConfigSlice(CloudflareEmailConfig, source).pipe(
      Effect.map((config) => createCloudflareEmail(config, fetchImpl)),
    ),
  ses: (source) =>
    parseEmailConfigSlice(SesEmailConfig, source).pipe(
      Effect.map((config) => createSesEmail(config)),
    ),
  resend: (source) =>
    parseEmailConfigSlice(ResendEmailConfig, source).pipe(
      Effect.map((config) => createResendEmail(config)),
    ),
} satisfies Partial<Record<EmailProviderNameType, EmailProviderFactory>>;

/**
 * Parse one email config schema slice into a typed Effect failure.
 *
 * @param schema - Effect Schema for the config slice.
 * @param source - Raw environment source to decode.
 * @returns Effect that succeeds with decoded config or fails with EmailError.
 * @example
 * const config = await Effect.runPromise(parseEmailConfigSlice(EmailConfig, process.env));
 */
const parseEmailConfigSlice = <A, I>(
  schema: Schema.Schema<A, I>,
  source: EnvSource,
): Effect.Effect<A, EmailError> =>
  tryEmail(
    () => parseEnv(schema, source),
    (caught) =>
      emailError({
        code: 'EMAIL_CONFIG_INVALID',
        message: caughtMessage(caught),
      }),
  );

/**
 * Look up the registered factory for an email provider.
 *
 * @param provider - Email provider key decoded from config.
 * @returns Effect that succeeds with the provider factory or fails loud when missing.
 * @example
 * const factory = await Effect.runPromise(findEmailProviderFactory('cloudflare'));
 */
const findEmailProviderFactory = (
  provider: EmailProviderNameType,
): Effect.Effect<EmailProviderFactory, EmailError> => {
  const createProvider = emailProviderFactories[provider];

  if (createProvider === undefined) {
    return failEmail({
      code: 'EMAIL_PROVIDER_UNSUPPORTED',
      message: `No email adapter is registered for provider ${provider}.`,
    });
  }

  return Effect.succeed(createProvider);
};

/**
 * Resolve the configured email provider from environment config.
 *
 * @param source - Environment object to parse, usually `process.env` at a composition root.
 * @param fetchImpl - Optional transport forwarded to the Cloudflare adapter for tests.
 * @returns An Effect that succeeds with the selected email provider or fails with EmailError.
 * @example
 * const provider = await Effect.runPromise(resolveEmailProvider(process.env));
 */
export const resolveEmailProvider = (
  source: EnvSource = process.env,
  fetchImpl?: FetchLike,
): Effect.Effect<EmailProvider, EmailError> =>
  parseEmailConfigSlice(EmailConfig, source).pipe(
    Effect.flatMap(({ EMAIL_PROVIDER }: EmailConfigType) =>
      findEmailProviderFactory(EMAIL_PROVIDER).pipe(
        Effect.flatMap((createProvider) => createProvider(source, fetchImpl)),
      ),
    ),
  );

/**
 * Build the configured Email Layer from environment config.
 *
 * @param source - Environment object to parse; defaults to `process.env` at the runtime edge.
 * @param fetchImpl - Optional transport forwarded to the Cloudflare adapter for tests.
 * @returns A Layer that provides Email or fails with EmailError during construction.
 * @example
 * const result = await Effect.runPromise(sendEmail(params).pipe(Effect.provide(makeEmailLive())));
 */
export const makeEmailLive = (
  source: EnvSource = process.env,
  fetchImpl?: FetchLike,
): Layer.Layer<Email, EmailError> => Layer.effect(Email, resolveEmailProvider(source, fetchImpl));

/**
 * Send one transactional email through the injected Email service.
 *
 * @param params - Validated send parameters for the email message.
 * @returns An Effect that succeeds with the provider message id or fails with EmailError.
 * @example
 * const result = await Effect.runPromise(sendEmail(params).pipe(Effect.provide(makeEmailLive())));
 */
export const sendEmail = (
  params: SendEmailParamsType,
): Effect.Effect<SendEmailResultType, EmailError, Email> =>
  Effect.flatMap(Email, ({ send }) => send(params));
