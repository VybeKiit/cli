'use client';

import type { ComponentType } from 'react';
import * as Mirror from '@/components/aceternity/loader';

const Component =
  (Mirror as { default?: ComponentType<object> }).default ??
  (Object.values(Mirror).find((value) => typeof value === 'function') as
    | ComponentType<object>
    | undefined);

export default function LoaderPreview() {
  if (!Component) {
    return null;
  }
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Component />
    </div>
  );
}
