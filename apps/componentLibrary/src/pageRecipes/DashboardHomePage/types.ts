import type { ReactNode } from 'react';

export type RangeKey = '24h' | '7d' | '30d';
export type MetricId = 'revenue' | 'customers' | 'active' | 'churn';
export type ActivityKind = 'signup' | 'order' | 'system';
export type Priority = 'high' | 'medium' | 'low';
export type LoadState = 'ready' | 'refreshing' | 'error';

/** A dashboard KPI. Presentation is static; the value/delta come per range from metrics data. */
export type MetricDef = {
  readonly id: MetricId;
  readonly label: string;
  readonly icon: ReactNode;
  readonly chip: string;
  readonly format: 'money' | 'number';
  /** Churn is healthier when it falls, so for it a negative delta is the "good" direction. */
  readonly invertDelta: boolean;
};

/** A metric's value (integer cents when money) and its change vs the previous period. */
export type MetricPoint = { readonly value: number; readonly deltaPct: number };

export type ActivityEvent = {
  readonly id: string;
  readonly kind: ActivityKind;
  readonly title: string;
  readonly meta: string;
  readonly time: string;
  readonly icon: ReactNode;
};

export type ActionItem = {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly priority: Priority;
  readonly icon: ReactNode;
};
