'use client';

import { Banner } from '@/components/kibo/banner/index';

export default function BannerPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Banner />
    </div>
  );
}
