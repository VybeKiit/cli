'use client';

import { FollowerPointerCard, FollowPointer } from '@/components/aceternity/ui/following-pointer';

export default function FollowingPointerPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <FollowerPointerCard />
      <FollowPointer />
    </div>
  );
}
