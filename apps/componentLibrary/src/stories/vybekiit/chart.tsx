'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@vybekiit/ui/chart';
import type { ChartConfig } from '@vybekiit/ui/chartContext';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

const data = [
  { month: 'Jan', revenue: 4200, expenses: 2800 },
  { month: 'Feb', revenue: 5800, expenses: 3100 },
  { month: 'Mar', revenue: 3900, expenses: 2600 },
  { month: 'Apr', revenue: 7100, expenses: 3400 },
  { month: 'May', revenue: 6300, expenses: 3900 },
  { month: 'Jun', revenue: 8400, expenses: 4200 },
];

const config = {
  revenue: { label: 'Revenue', color: 'hsl(var(--chart-1))' },
  expenses: { label: 'Expenses', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

/** Bar chart using ChartContainer, ChartTooltip, and ChartTooltipContent with two series. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="w-full max-w-md space-y-2">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Revenue vs Expenses
      </p>
      <ChartContainer config={config} className="h-56 w-full max-w-md">
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
          <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  ),
};

export default story;
