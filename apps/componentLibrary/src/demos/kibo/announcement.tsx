'use client';

import { Announcement } from '@/components/kibo/announcement/index';

export default function AnnouncementPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Announcement />
    </div>
  );
}
