'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Kpi } from '@vybekiit/ui/kpi';
import { DollarSign, TrendingDown, TrendingUp, Users } from 'lucide-react';

/** Row and stack KPI layouts across Revenue, Signups, and Churn metrics. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Row layout (icon + label/value)
        </p>
        <div className="flex flex-wrap gap-4">
          <Kpi
            label="Monthly Revenue"
            value="$48,320"
            icon={<DollarSign className="h-4 w-4" />}
            hint="+12% vs last month"
          />
          <Kpi
            label="New Signups"
            value="1,284"
            icon={<Users className="h-4 w-4" />}
            hint="+8% vs last month"
          />
          <Kpi
            label="Churn Rate"
            value="2.4%"
            icon={<TrendingDown className="h-4 w-4" />}
            hint="-0.3% vs last month"
            valueClassName="text-destructive"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Stack layout (centered big number)
        </p>
        <div className="flex flex-wrap gap-4">
          <Kpi label="MRR" value="$48k" layout="stack" className="w-36" />
          <Kpi label="Signups" value="1,284" layout="stack" className="w-36" />
          <Kpi
            label="Churn"
            value="2.4%"
            layout="stack"
            valueClassName="text-destructive"
            className="w-36"
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Stack layout with icon + hint
        </p>
        <div className="flex flex-wrap gap-4">
          <Kpi
            label="Total Revenue"
            value="$124,800"
            icon={<DollarSign className="h-4 w-4" />}
            hint="Up from $111k last quarter"
            layout="stack"
            className="w-52"
          />
          <Kpi
            label="Active Users"
            value="9,341"
            icon={<TrendingUp className="h-4 w-4" />}
            hint="Highest this year"
            layout="stack"
            className="w-52"
          />
        </div>
      </div>
    </div>
  ),
};

export default story;
