/**
 * Dashboard content as data the screen renders via `.map`. Mirrors the web
 * template's `data/dashboard.ts`.
 *
 * Why it lives here: the agent (and builder) edit one array instead of dashboard
 * JSX. The stat cards ship as placeholders the `save-data` skill wires to real
 * numbers; the getting-started list is the plain-language menu of next goals. The
 * screen keeps its route-guard and real-data TODO markers.
 */

/** One stat card on the dashboard: a label and its (placeholder) value. */
export interface DashboardStat {
  /** Card label, e.g. "Users". */
  readonly label: string;
  /** Display value; "—" until the save-data skill wires real numbers. */
  readonly value: string;
}

/** Placeholder stat cards — wired to real data by the `save-data` skill. */
export const DASHBOARD_STATS: readonly DashboardStat[] = [
  { label: 'Users', value: '—' },
  { label: 'Revenue', value: '—' },
  { label: 'Active today', value: '—' },
];

/** The plain-language "what to ask your agent next" list shown on the dashboard. */
export const GETTING_STARTED: readonly string[] = [
  'Add sign-in so people can log in.',
  'Add payments so you can charge for this.',
  'Put your app in the App Store and Play Store.',
];
