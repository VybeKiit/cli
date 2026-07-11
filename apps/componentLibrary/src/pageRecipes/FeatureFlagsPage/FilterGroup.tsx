'use client';

import { SegmentedControl, SegmentedControlItem } from '@vybekiit/ui/segmented-control';
import { useId } from 'react';

/** Segmented filter control. */
export const FilterGroup = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly onChange: (value: T) => void;
}) => {
  const labelId = useId();
  return (
    <div className="flex items-center gap-2">
      <span className="sr-only" id={labelId}>
        {label}
      </span>
      <SegmentedControl
        aria-labelledby={labelId}
        onValueChange={(next) => onChange(next as T)}
        size="sm"
        value={value}
      >
        {options.map((option) => (
          <SegmentedControlItem key={option.value} value={option.value}>
            {option.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </div>
  );
};
