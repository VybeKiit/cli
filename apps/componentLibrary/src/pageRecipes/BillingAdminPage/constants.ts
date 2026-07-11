import type { PlanId, SubStatus, Subscription } from './types';

export const PLAN_LABEL: Record<PlanId, string> = {
  starter: 'Starter',
  pro: 'Pro',
  scale: 'Scale',
};

/** Badge label + tone for each subscription status. Status is never conveyed by color alone. */
export const STATUS_META: Record<
  SubStatus,
  { readonly label: string; readonly className: string }
> = {
  active: {
    label: 'Active',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600',
  },
  trialing: { label: 'Trialing', className: 'border-blue-500/30 bg-blue-500/10 text-blue-600' },
  past_due: { label: 'Past due', className: 'border-amber-500/40 bg-amber-500/10 text-amber-600' },
  canceled: { label: 'Canceled', className: 'border-border bg-muted text-muted-foreground' },
};

export const STATUS_FILTERS: readonly {
  readonly value: 'all' | SubStatus;
  readonly label: string;
}[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'past_due', label: 'Past due' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'canceled', label: 'Canceled' },
];

/** Realistic multi-customer ledger — a spread of plans and every lifecycle status. */
export const INITIAL_SUBS: readonly Subscription[] = [
  {
    id: 'sub_8Kd21',
    customer: 'Aria Montgomery',
    email: 'aria@northwind.io',
    plan: 'scale',
    status: 'active',
    mrrCents: 24_900,
    seats: 12,
    renewsAt: '2026-08-02',
  },
  {
    id: 'sub_5Rn09',
    customer: 'Marcus Bell',
    email: 'marcus@stackforge.dev',
    plan: 'pro',
    status: 'active',
    mrrCents: 8900,
    seats: 5,
    renewsAt: '2026-07-19',
  },
  {
    id: 'sub_3Qp77',
    customer: 'Lena Fischer',
    email: 'lena@brightloop.co',
    plan: 'pro',
    status: 'past_due',
    mrrCents: 8900,
    seats: 4,
    renewsAt: '2026-07-11',
  },
  {
    id: 'sub_9Wa14',
    customer: 'Diego Ramirez',
    email: 'diego@quantly.app',
    plan: 'starter',
    status: 'trialing',
    mrrCents: 2900,
    seats: 2,
    renewsAt: '2026-07-16',
  },
  {
    id: 'sub_2Fh63',
    customer: 'Priya Nair',
    email: 'priya@cadence.team',
    plan: 'scale',
    status: 'active',
    mrrCents: 24_900,
    seats: 20,
    renewsAt: '2026-08-08',
  },
  {
    id: 'sub_7Lc38',
    customer: 'Tom Becker',
    email: 'tom@paperkite.io',
    plan: 'starter',
    status: 'past_due',
    mrrCents: 2900,
    seats: 1,
    renewsAt: '2026-07-10',
  },
  {
    id: 'sub_4Vd50',
    customer: 'Sofia Rossi',
    email: 'sofia@lumenworks.com',
    plan: 'pro',
    status: 'canceled',
    mrrCents: 8900,
    seats: 6,
    renewsAt: '2026-07-05',
  },
  {
    id: 'sub_6Zx82',
    customer: 'Noah Kim',
    email: 'noah@driftlabs.dev',
    plan: 'starter',
    status: 'trialing',
    mrrCents: 2900,
    seats: 3,
    renewsAt: '2026-07-20',
  },
];

/** Stable keys for skeleton rows (avoids array-index keys during the loading state). */
export const SKELETON_ROWS = ['sk1', 'sk2', 'sk3', 'sk4', 'sk5'] as const;

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export const LOAD_MS = 700;
export const RETRY_MS = 1100;
