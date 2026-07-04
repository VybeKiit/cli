'use client';

import IPhoneMockup from '@/components/blocks/21st/iphone-mockup';

export default function IphoneMockupPreview() {
  return (
    <div className="flex min-h-[520px] items-center justify-center p-6">
      <IPhoneMockup
        color="natural-titanium"
        model="15-pro"
        scale={0.85}
        wallpaper="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop"
      />
    </div>
  );
}
