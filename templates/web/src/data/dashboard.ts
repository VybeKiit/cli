/**
 * Dashboard content as data the page renders via `.map`.
 *
 * Labels and steps are message-catalog keys resolved with `t()` on the page.
 */

/** One stat card on the dashboard. */
export interface DashboardStat {
  readonly labelKey: string;
  readonly valueKey: string;
}

/** Placeholder stat cards — wired to real data by the `save-data` skill. */
export const DASHBOARD_STATS: readonly DashboardStat[] = [
  { labelKey: 'dashboard.stats.users.label', valueKey: 'dashboard.stats.users.value' },
  { labelKey: 'dashboard.stats.revenue.label', valueKey: 'dashboard.stats.revenue.value' },
  {
    labelKey: 'dashboard.stats.activeToday.label',
    valueKey: 'dashboard.stats.activeToday.value',
  },
];

/** Getting-started step keys shown on the dashboard. */
export const GETTING_STARTED_STEP_KEYS: readonly string[] = [
  'dashboard.gettingStarted.steps.0',
  'dashboard.gettingStarted.steps.1',
  'dashboard.gettingStarted.steps.2',
];
