'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Label } from '@vybekiit/ui/label';
import { RadioGroup, RadioGroupItem } from '@vybekiit/ui/radio-group';
import { useId } from 'react';

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
] as const;

/** One real RadioGroup with bound labels. */
const PlanGroup = ({ disabled }: { readonly disabled?: boolean }) => {
  const name = useId();
  return (
    <RadioGroup defaultValue="pro" disabled={disabled}>
      {PLANS.map((plan) => {
        const id = `${name}-${plan.value}`;
        return (
          <div className="flex items-center gap-3" key={plan.value}>
            <RadioGroupItem id={id} value={plan.value} />
            <Label htmlFor={id}>{plan.label}</Label>
          </div>
        );
      })}
    </RadioGroup>
  );
};

/** Default and disabled RadioGroups, laid out at once. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap gap-x-16 gap-y-6">
      <div className="space-y-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Default</p>
        <PlanGroup />
      </div>
      <div className="space-y-2">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Disabled
        </p>
        <PlanGroup disabled={true} />
      </div>
    </div>
  ),
};

export default story;
