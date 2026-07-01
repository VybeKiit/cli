'use client';

import type { ComponentType } from 'react';
import * as Mirror from '@/components/aceternity/3d-pin';

const Component =
  (Mirror as { default?: ComponentType<object> }).default ??
  (Object.values(Mirror).find((value) => typeof value === 'function') as
    | ComponentType<object>
    | undefined);

export default function Demo3dPinPreview() {
  if (!Component) {
    return null;
  }
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Component />
    </div>
  );
}
