'use client';

import {
  AppStoreButton,
  GalaxyStoreButton,
  GooglePlayButton,
  GooglePlayWhiteButton,
} from '@/components/untitled/buttons/app-store-buttons';

export default function AppStoreButtonsPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <GooglePlayButton />
      <GooglePlayWhiteButton />
      <AppStoreButton />
      <GalaxyStoreButton />
    </div>
  );
}
