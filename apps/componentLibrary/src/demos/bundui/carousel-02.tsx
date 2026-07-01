'use client';

import type { ComponentType } from 'react';
import * as Mirror from '@/components/bundui/carousel-02';

const Component =
  (Mirror as { default?: ComponentType<object> }).default ??
  (Object.values(Mirror).find((value) => typeof value === 'function') as
    | ComponentType<object>
    | undefined);

export default function Carousel02Preview() {
  if (!Component) {
    return null;
  }
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Component />
    </div>
  );
}
