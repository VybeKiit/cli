'use client';

import {
  AppGalleryButton,
  AppStoreButton,
  GalaxyStoreButton,
  GooglePlayButton,
} from '@/components/untitled/buttons/app-store-buttons-outline';

export default function AppStoreButtonsOutlinePreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <GooglePlayButton />
      <AppStoreButton />
      <GalaxyStoreButton />
      <AppGalleryButton />
    </div>
  );
}
