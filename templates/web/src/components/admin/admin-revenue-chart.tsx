'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useId } from 'react';

// Mock MRR data — replace with @vybekiit/payments real queries
const MOCK_MRR_DATA = [
  { month: 'Jan', mrr: 2400 },
  { month: 'Feb', mrr: 3200 },
  { month: 'Mar', mrr: 4100 },
  { month: 'Apr', mrr: 4800 },
  { month: 'May', mrr: 5900 },
  { month: 'Jun', mrr: 7200 },
  { month: 'Jul', mrr: 8500 },
];

const formatCurrencyTick = (value: string | number) => `$${value}`;

const formatMrrTooltip = (value: unknown): [string, string] => {
  const amount = Array.isArray(value) ? value[0] : value;
  const numericAmount =
    typeof amount === 'number' || typeof amount === 'string' ? Number(amount) : 0;

  return [`$${numericAmount.toLocaleString()}`, 'MRR'];
};

/**
 * Render the admin monthly recurring revenue chart.
 *
 * @returns A card containing the starter MRR area chart.
 * @example
 * <AdminRevenueChart />
 */
export const AdminRevenueChart = () => {
  const gradientId = `mrr-gradient-${useId().replaceAll(':', '')}`;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Monthly Recurring Revenue</h3>
          <p className="text-muted-foreground text-sm">Revenue growth over the last 7 months</p>
        </div>
        <span className="font-bold text-2xl">$8,500</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_MRR_DATA} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrencyTick}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={formatMrrTooltip}
            />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
