/**
 * Dashboard content as data the screen renders via `.map`.
 * Labels and steps are message-catalog keys resolved with `t()`.
 */

export type DashboardStat = Readonly<{
  readonly labelKey: string;
  readonly valueKey: string;
}>;

/** Dashboard stat cards rendered on the signed-in overview tab. */
export const DASHBOARD_STATS: readonly DashboardStat[] = [
  { labelKey: 'dashboard.stats.users.label', valueKey: 'dashboard.stats.users.value' },
  { labelKey: 'dashboard.stats.revenue.label', valueKey: 'dashboard.stats.revenue.value' },
  {
    labelKey: 'dashboard.stats.activeToday.label',
    valueKey: 'dashboard.stats.activeToday.value',
  },
];

/** Ordered message keys for the dashboard getting-started checklist. */
export const GETTING_STARTED_STEP_KEYS: readonly string[] = [
  'dashboard.gettingStarted.steps.0',
  'dashboard.gettingStarted.steps.1',
  'dashboard.gettingStarted.steps.2',
];
