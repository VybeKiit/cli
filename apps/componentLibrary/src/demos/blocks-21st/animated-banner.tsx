'use client';

import { AnimatedBanner } from '@/components/blocks/21st/animated-banner';

export default function AnimatedBannerPreview() {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-6">
      <AnimatedBanner
        className="max-w-2xl"
        title="Ship faster with VybeKiit"
        subtitle="Agent-driven starter kit for builders"
        ctaLabel="Explore"
        posterSrc="https://images.unsplash.com/photo-1557683316-973673bdafae?w=1200&auto=format&fit=crop&q=80"
      />
    </div>
  );
}
