export type {
  Hosting,
  HostingProviderName,
  DeployOptions,
  DeployResult,
  DeployStatus,
} from './types';
export { resolveHosting, type HostingRunners } from './resolve';
export {
  createCloudflareHosting,
  type CloudflareDeployAction,
  type CloudflareRunResult,
  type CloudflareRunner,
} from './providers/cloudflare';
export {
  createVercelHosting,
  type VercelDeployAction,
  type VercelRunResult,
  type VercelRunner,
} from './providers/vercel';
export {
  createRailwayHosting,
  type RailwayDeployAction,
  type RailwayRunResult,
  type RailwayRunner,
} from './providers/railway';
export { createAwsHosting, type AmplifyRunner } from './providers/aws';
export {
  getOrCreateZone,
  type CloudflareZone,
} from './cloudflare/zones';
export {
  NamecheapError,
  parseNamecheapDomain,
  verifyNamecheapCredentials,
  setCustomNameservers,
} from './registrar/namecheap';
export {
  GodaddyError,
  verifyGodaddyCredentials,
  setGodaddyNameservers,
} from './registrar/godaddy';
