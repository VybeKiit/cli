'use client';

import posthog from 'posthog-js';
import type { AnalyticsEventName, AnalyticsProperties } from '@/lib/analyticsEvents';

/**
 * Whether the browser bundle has a PostHog project token (inlined at build time).
 *
 * @returns True when client capture should run.
 */
const isPostHogConfigured = (): boolean => {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  return token !== undefined && token.length > 0;
};

/**
 * Capture a client-side analytics event when PostHog is configured.
 * Safe no-op without a project token.
 *
 * @param event - Event name from {@link AnalyticsEvent}.
 * @param properties - Optional event properties (no PII beyond intentional identify).
 * @returns Nothing.
 * @example
 * trackClient(AnalyticsEvent.ctaClicked, { location: 'hero_primary', href: '/checkout' });
 */
export const trackClient = (event: AnalyticsEventName, properties?: AnalyticsProperties): void => {
  if (typeof window === 'undefined' || !isPostHogConfigured()) {
    return;
  }
  posthog.capture(event, properties === undefined ? undefined : { ...properties });
};

/**
 * Identify the buyer after they enter contact details at checkout.
 * Links subsequent funnel events (and payment success) to one person.
 *
 * @param email - Buyer email (used as distinct id).
 * @param traits - Extra person properties (e.g. GitHub username).
 * @returns Nothing.
 * @example
 * identifyClient('you@example.com', { github_username: 'octocat' });
 */
export const identifyClient = (email: string, traits?: Readonly<Record<string, string>>): void => {
  if (typeof window === 'undefined' || !isPostHogConfigured()) {
    return;
  }
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0) {
    return;
  }
  posthog.identify(trimmed, {
    email: trimmed,
    ...(traits === undefined ? {} : traits),
  });
};
