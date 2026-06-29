'use client';

import { useEffect } from 'react';
import { getAnalytics } from '@/lib/analytics-client';

/** Injects visitor-stats script when configured — skill: add-analytics */
export function VybeAnalytics() {
  useEffect(() => {
    const config = getAnalytics().getScriptConfig();
    if (!config?.src) return;
    const script = document.createElement('script');
    script.defer = true;
    script.src = config.src;
    if (config.domain) script.dataset.domain = config.domain;
    document.head.appendChild(script);
  }, []);
  return null;
}
