export {
  type CloudflareWorkerSendBody,
  parseWorkerSendBody,
  toWorkerSendBody,
} from './cloudflare/workerContract';
export { createCloudflareEmail, type FetchLike } from './providers/cloudflare';
export { createSesEmail } from './providers/ses';
export { resolveEmailProvider } from './resolve';
export type { EmailProvider, EmailProviderName, SendEmailParams } from './types';
