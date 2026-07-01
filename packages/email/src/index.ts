export type { EmailProvider, EmailProviderName, SendEmailParams } from './types';
export { resolveEmailProvider } from './resolve';
export { createCloudflareEmail, type FetchLike } from './providers/cloudflare/index';
export { createSesEmail } from './providers/ses/index';
export { createEmailWorkerHandler, type EmailWorkerEnv } from './cloudflare/worker-handler';
export {
  toWorkerSendBody,
  parseWorkerSendBody,
  type CloudflareWorkerSendBody,
} from './cloudflare/worker-contract';
