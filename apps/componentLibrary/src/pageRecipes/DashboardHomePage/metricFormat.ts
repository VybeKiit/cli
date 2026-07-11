import { formatUsdCents } from '../shared/formatUsdCents';
import type { MetricDef } from './types';

const formatNumber = (value: number): string => new Intl.NumberFormat('en-US').format(value);

/**
 * Format a metric value as money or a plain number.
 *
 * @param def - Metric presentation rules.
 * @param value - Raw numeric value.
 * @returns Display string.
 */
export const formatMetric = (def: MetricDef, value: number): string =>
  def.format === 'money' ? formatUsdCents(value) : formatNumber(value);

/** A rising delta is good, unless the metric is inverted (churn) where a falling delta is the win. */
export const isGoodDelta = (deltaPct: number, invert: boolean): boolean => {
  if (deltaPct === 0) {
    return true;
  }
  return deltaPct > 0 !== invert;
};
