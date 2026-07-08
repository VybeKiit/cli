import { SESv2Client, SendEmailCommand, type SendEmailCommandOutput } from '@aws-sdk/client-sesv2';
import type { SesEmailConfigType } from '@vybekiit/email/config';
import { caughtMessage, emailError, failEmail } from '@vybekiit/email/emailEffect';
import type { EmailProvider, SendEmailParamsType } from '@vybekiit/email/types';
import { Effect } from 'effect';

/**
 * Build the Amazon SES email provider.
 *
 * @param config - SES region and optional AWS access keys decoded from `SesEmailConfig`.
 * @param client - SES client used to send the command; omit to construct a real client.
 * @returns An email provider whose `send` method returns an Effect with typed email failures.
 * @example
 * const provider = createSesEmail(config);
 * const sent = await Effect.runPromise(provider.send(params));
 */
export const createSesEmail = (
  config: SesEmailConfigType,
  client?: Pick<SESv2Client, 'send'>,
): EmailProvider => {
  const sesClient = client === undefined ? createSesClient(config) : client;
  return {
    name: 'ses',

    send: (params: SendEmailParamsType) =>
      Effect.gen(function* () {
        const body =
          params.text === undefined
            ? {
                Html: { Data: params.html },
              }
            : {
                Html: { Data: params.html },
                Text: { Data: params.text },
              };

        const response = yield* Effect.tryPromise({
          try: () =>
            sesClient.send(
              new SendEmailCommand({
                FromEmailAddress: params.from,
                Destination: { ToAddresses: [params.to] },
                Content: {
                  Simple: {
                    Subject: { Data: params.subject },
                    Body: body,
                  },
                },
              }),
            ) as Promise<SendEmailCommandOutput>,
          catch: (caught) =>
            emailError({
              code: 'EMAIL_SEND_FAILED',
              message: caughtMessage(caught),
            }),
        });

        if (response.MessageId === undefined || response.MessageId.length === 0) {
          return yield* failEmail({
            code: 'EMAIL_INVALID_RESPONSE',
            message: 'SES did not return a message id.',
          });
        }

        return { id: response.MessageId };
      }),
  };
};

/**
 * Construct the SES client for live sends.
 *
 * @param config - SES region and optional AWS credentials.
 * @returns SES v2 client.
 * @example
 * const client = createSesClient(config);
 */
const createSesClient = (config: SesEmailConfigType): SESv2Client => {
  const { AWS_ACCESS_KEY_ID: accessKeyId, AWS_SECRET_ACCESS_KEY: secretAccessKey } = config;

  return new SESv2Client({
    region: config.AWS_REGION,
    ...(accessKeyId !== undefined && secretAccessKey !== undefined
      ? {
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        }
      : {}),
  });
};
