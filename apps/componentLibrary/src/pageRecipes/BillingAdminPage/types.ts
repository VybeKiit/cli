export type PlanId = 'starter' | 'pro' | 'scale';
export type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled';
export type LoadState = 'loading' | 'ready' | 'error';
export type StatusFilter = 'all' | SubStatus;

/** One customer's subscription as the billing console sees it. MRR is integer cents. */
export type Subscription = {
  readonly id: string;
  readonly customer: string;
  readonly email: string;
  readonly plan: PlanId;
  readonly status: SubStatus;
  readonly mrrCents: number;
  readonly seats: number;
  readonly renewsAt: string;
};
