// `@aws-sdk/client-sesv2` is the AWS SDK v3 client for Amazon SES v2 (Simple Email
// Service). We target SESv2 (not the legacy `client-ses`) because SendEmailCommand's
// structured Content.Simple shape maps cleanly onto our normalized SendEmailParams and
// is AWS's current, recommended sending API.
import { SESv2Client, SendEmailCommand, type SendEmailCommandOutput } from '@aws-sdk/client-sesv2';
import { type AwsConfig, type Result, fail, ok } from '@vybekiit/core';
import type { EmailProvider, SendEmailParams } from '../../types';

/**
 * Build the Amazon SES {@link EmailProvider} — the opt-in transactional sender a buyer
 * selects with `EMAIL_PROVIDER=ses` (ADR-0002). Unlike the Cloudflare adapter (which
 * POSTs to a deployed Worker route), SES is a first-class outbound API, so `send` calls
 * it directly.
 *
 * Credentials mirror the AWS data + S3 adapters: `AWS_REGION` is always required; when
 * both `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are present we pass them
 * explicitly, otherwise the SDK's default credential chain applies. `from` must be an
 * SES-verified identity; an unverified sender surfaces as an `email_send_failed` result
 * (matching the Cloudflare adapter's failure handling) rather than a thrown error.
 */
export function createSesEmail(config: AwsConfig): EmailProvider {
  const hasExplicitCredentials =
    config.AWS_ACCESS_KEY_ID !== undefined && config.AWS_SECRET_ACCESS_KEY !== undefined;

  const client = new SESv2Client({
    region: config.AWS_REGION,
    ...(hasExplicitCredentials
      ? {
          credentials: {
            // Narrowed to non-null by `hasExplicitCredentials`.
            accessKeyId: config.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY as string,
          },
        }
      : {}),
  });

  return {
    name: 'ses',

    async send(params: SendEmailParams): Promise<Result<{ id: string }>> {
      let response: SendEmailCommandOutput;
      try {
        response = await client.send(
          new SendEmailCommand({
            FromEmailAddress: params.from,
            Destination: { ToAddresses: [params.to] },
            Content: {
              Simple: {
                Subject: { Data: params.subject },
                Body: {
                  Html: { Data: params.html },
                  ...(params.text ? { Text: { Data: params.text } } : {}),
                },
              },
            },
          }),
        );
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'unknown SES error';
        return fail('email_send_failed', detail);
      }

      const { MessageId } = response;
      if (!MessageId) {
        return fail('email_send_failed', 'SES did not return a message id.');
      }
      return ok({ id: MessageId });
    },
  };
}
