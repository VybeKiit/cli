'use client';

import type { ComponentType } from 'react';
import * as Mirror from '@/components/aceternity/following-pointer';

const Component = Object.values(Mirror).find(
  (value): value is ComponentType<object> => typeof value === 'function',
);

export default function FollowingPointerPreview() {
  if (!Component) {
    return null;
  }
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Component />
    </div>
  );
}
