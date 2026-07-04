/** Env flag — Report Mode dock renders only when this is truthy in local dev. */
export const REPORT_MODE_ENABLED_ENV = 'VYBE_REPORT_MODE';

function isTruthyFlag(raw: string | undefined): boolean {
  const normalized = raw?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true';
}

/** True when running the Next/Vite dev server — never true in production builds. */
export function isVybeLocalDevHost(env: Record<string, string | undefined>): boolean {
  return env.NODE_ENV === 'development';
}

/** Report Mode opt-in flag (local vibe-coder QA tool). */
export function isReportModeEnabled(env: Record<string, string | undefined>): boolean {
  return isTruthyFlag(env[REPORT_MODE_ENABLED_ENV]);
}

/** Report Mode shell should mount only on a local dev host with the flag on. */
export function shouldShowReportMode(env: Record<string, string | undefined>): boolean {
  return isVybeLocalDevHost(env) && isReportModeEnabled(env);
}
