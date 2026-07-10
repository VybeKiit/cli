'use client';

import { ExtensionPopupScene } from '@/components/landing/kit/ExtensionPopupScene';

/**
 * Browser Extension carousel slide — cursor clicks the toolbar icon, popup opens.
 *
 * @returns The rendered ExtensionSlide element.
 * @example
 * ```tsx
 * <ExtensionSlide />
 * ```
 */
export const ExtensionSlide = () => (
  <div className="flex h-full items-stretch justify-center bg-[#eef2f7] p-3">
    <ExtensionPopupScene animated={true} className="h-full min-h-[280px] w-full max-w-[420px]" />
  </div>
);
