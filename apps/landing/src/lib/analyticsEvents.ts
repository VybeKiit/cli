/**
 * Landing store analytics event names and capture helpers (PostHog).
 * Client uses `posthog-js` (inited in `instrumentation-client.ts`).
 * Server uses `posthog-node` via {@link captureServerEvent}.
 *
 * Naming: snake_case action past tense — funnel steps are ordered in the checklist.
 */

/** Important conversion and engagement events for the store funnel. */
export const AnalyticsEvent = {
  /** Primary/secondary marketing CTA toward checkout or in-page sections. */
  ctaClicked: 'cta_clicked',
  /** Buyer opened `/checkout`. */
  checkoutPageViewed: 'checkout_page_viewed',
  /** First interaction with a checkout form field. */
  checkoutFormStarted: 'checkout_form_started',
  /** Client-side validation failed before API call. */
  checkoutValidationFailed: 'checkout_validation_failed',
  /** Valid form submitted; about to call `/api/checkout`. */
  checkoutSubmitted: 'checkout_submitted',
  /** Hosted checkout URL created; browser redirects to payment provider. */
  checkoutSessionCreated: 'checkout_session_created',
  /** Checkout session creation failed (API or network). */
  checkoutSessionFailed: 'checkout_session_failed',
  /** Payment success page loaded (provider redirected here). */
  purchaseCompleted: 'purchase_completed',
  /** Buyer abandoned hosted checkout and hit `/cancel`. */
  checkoutCanceled: 'checkout_canceled',
  /** FAQ accordion opened. */
  faqOpened: 'faq_opened',
  /** Nav link to an in-page section. */
  navClicked: 'nav_clicked',
  /** Support channel click on success page. */
  supportClicked: 'support_clicked',
  /** Server: payment webhook accepted and gate ran. */
  orderFulfilled: 'order_fulfilled',
  /** Server: payment webhook indicated a refund and gate removed access. */
  orderRefunded: 'order_refunded',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

/** Known CTA placement labels for `cta_clicked.location`. */
export type CtaLocation =
  | 'hero_primary'
  | 'hero_secondary'
  | 'header'
  | 'pricing'
  | 'vibe_story'
  | 'cancel_retry'
  | 'dialog';

/** Loose property bag for capture (PostHog accepts JSON-serializable values). */
export type AnalyticsProperties = Readonly<Record<string, string | number | boolean | null>>;
