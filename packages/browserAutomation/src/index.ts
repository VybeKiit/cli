/**
 * @vybekiit/browser-automation — unified dashboard Playwright automation.
 */

export { connectToChrome } from './core/connect';
export {
  ensureChromeWithCdp,
  getChromeUserDataDirForPort,
  isCdpReachable,
} from './core/launchChrome';
export { type BaseVerbContext, DEFAULT_CDP_ENDPOINT, PROFILE_PATHS } from './core/types';
export * from './domains/extension';
export * from './domains/google';
export * from './domains/payments';
