import { type FeedbackDraft, redactFeedbackDraft } from '@vybekiit/agent-kit';
import { Schema } from 'effect';

const DeviceLoginSchema = Schema.Struct({
  deviceCode: Schema.String,
  userCode: Schema.String,
  verificationUri: Schema.String,
  expiresIn: Schema.Number,
  interval: Schema.Number,
});

const IntakeSessionStateSchema = Schema.Union(
  Schema.Struct({
    status: Schema.Literal('pending'),
    retryAfter: Schema.optional(Schema.Number),
  }),
  Schema.Struct({ status: Schema.Literal('ready'), session: Schema.String }),
  Schema.Struct({ status: Schema.Literal('denied'), message: Schema.String }),
);

const FeedbackReceiptSchema = Schema.Struct({ reference: Schema.String });

export type DeviceLogin = Schema.Schema.Type<typeof DeviceLoginSchema>;
export type IntakeSessionState = Schema.Schema.Type<typeof IntakeSessionStateSchema>;

export interface SubmitFeedbackInput {
  readonly session: string;
  readonly draft: FeedbackDraft;
}

export interface FeedbackIntakeClient {
  readonly createDeviceLogin: () => Promise<DeviceLogin>;
  readonly pollDeviceLogin: (deviceCode: string) => Promise<IntakeSessionState>;
  readonly submit: (input: SubmitFeedbackInput) => Promise<{ readonly reference: string }>;
}

interface FeedbackClientOptions {
  readonly baseUrl?: string;
  readonly fetch?: typeof globalThis.fetch;
}

const resolveBaseUrl = (configuredUrl?: string): string => {
  const baseUrl = configuredUrl || process.env.VYBEKIIT_API_URL || 'https://vybekiit.com/api';
  const parsedUrl = new URL(baseUrl);
  const localDevelopment = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1';
  if (parsedUrl.protocol !== 'https:' && !localDevelopment) {
    throw new Error('Feedback intake requires HTTPS.');
  }
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const readJson = async <A>(response: Response, schema: Schema.Schema<A>): Promise<A> => {
  if (!response.ok) {
    throw new Error(`Feedback intake returned ${response.status}.`);
  }
  return Schema.decodeUnknownSync(schema)(await response.json());
};

export const createFeedbackIntakeClient = (
  options: FeedbackClientOptions = {},
): FeedbackIntakeClient => {
  const baseUrl = resolveBaseUrl(options.baseUrl);
  const fetchRequest = options.fetch || globalThis.fetch;

  return {
    createDeviceLogin: async () => {
      const response = await fetchRequest(`${baseUrl}/feedback/auth/device`, { method: 'POST' });
      return await readJson(response, DeviceLoginSchema);
    },
    pollDeviceLogin: async (deviceCode) => {
      const response = await fetchRequest(`${baseUrl}/feedback/auth/poll`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deviceCode }),
      });
      return await readJson(response, IntakeSessionStateSchema);
    },
    submit: async ({ session, draft }) => {
      const response = await fetchRequest(`${baseUrl}/feedback/report`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${session}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(redactFeedbackDraft(draft)),
      });
      return await readJson(response, FeedbackReceiptSchema);
    },
  };
};
