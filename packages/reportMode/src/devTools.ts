/** Env flag that allows Report Mode to render on a local dev host. */
export const REPORT_MODE_ENABLED_ENV = 'VYBE_REPORT_MODE';

/**
 * Parse a truthy env flag value.
 *
 * @param raw - Optional raw env value.
 * @returns `true` when the value is `1` or `true`.
 * @example
 * const enabled = isTruthyFlag(process.env.VYBE_REPORT_MODE);
 */
const isTruthyFlag = (raw: string | undefined): boolean => {
  if (raw === undefined) {
    return false;
  }

  const normalized = raw.trim().toLowerCase();
  return normalized === '1' || normalized === 'true';
};

/**
 * Check whether the host is running a local development build.
 *
 * @param env - Environment variables from the app host.
 * @returns `true` when `NODE_ENV` is `development`.
 * @example
 * const local = isVybeLocalDevHost(process.env);
 */
export const isVybeLocalDevHost = (env: Record<string, string | undefined>): boolean =>
  env.NODE_ENV === 'development';

/**
 * Check whether the Report Mode opt-in flag is enabled.
 *
 * @param env - Environment variables from the app host.
 * @returns `true` when `VYBE_REPORT_MODE` is truthy.
 * @example
 * const enabled = isReportModeEnabled(process.env);
 */
export const isReportModeEnabled = (env: Record<string, string | undefined>): boolean =>
  isTruthyFlag(env[REPORT_MODE_ENABLED_ENV]);

/**
 * Decide whether the Report Mode shell should mount.
 *
 * @param env - Environment variables from the app host.
 * @returns `true` only on a local dev host with Report Mode enabled.
 * @example
 * const show = shouldShowReportMode(process.env);
 */
export const shouldShowReportMode = (env: Record<string, string | undefined>): boolean =>
  isVybeLocalDevHost(env) && isReportModeEnabled(env);
