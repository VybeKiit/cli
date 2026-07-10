'use client';

import { useEffect, useRef } from 'react';
import { trackClient } from '@/lib/analyticsClient';
import type { AnalyticsEventName, AnalyticsProperties } from '@/lib/analyticsEvents';

interface PageEventProps {
  readonly event: AnalyticsEventName;
  readonly properties?: AnalyticsProperties;
}

/**
 * Fire a one-shot client analytics event when a page or section mounts.
 * Use for funnel steps that are full-page destinations (checkout, success, cancel).
 *
 * @param props - Event name and optional properties.
 * @returns Null (side-effect only).
 * @example
 * <PageEvent event={AnalyticsEvent.purchaseCompleted} />
 */
export const PageEvent = ({ event, properties }: PageEventProps) => {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) {
      return;
    }
    firedRef.current = true;
    trackClient(event, properties);
  }, [event, properties]);

  return null;
};
