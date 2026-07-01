/**
 * @vybekiit/browser-automation — unified dashboard Playwright automation.
 */

export { connectToChrome } from './core/connect';
export {
  ensureChromeWithCdp,
  getChromeUserDataDirForPort,
  isCdpReachable,
} from './core/launchChrome';
export { DEFAULT_CDP_ENDPOINT, PROFILE_PATHS, type BaseVerbContext } from './core/types';
export * from './domains/extension';
export * from './domains/payments';
