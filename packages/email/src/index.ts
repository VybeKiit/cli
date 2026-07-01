export type { EmailProvider, EmailProviderName, SendEmailParams } from './types';
export { resolveEmailProvider } from './resolve';
export { createCloudflareEmail, type FetchLike } from './providers/cloudflare';
export { createSesEmail } from './providers/ses';
export { createEmailWorkerHandler, type EmailWorkerEnv } from './cloudflare/workerHandler';
export {
  toWorkerSendBody,
  parseWorkerSendBody,
  type CloudflareWorkerSendBody,
} from './cloudflare/workerContract';
