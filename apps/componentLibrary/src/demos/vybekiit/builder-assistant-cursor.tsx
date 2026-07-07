'use client';

import { BuilderAssistantMark } from '@/components/builder-assistant-mark';

/**
 * Renders the cursor assistant mark preview.
 *
 * @returns The rendered assistant mark preview.
 * @example
 * <BuilderAssistantCursorPreview />
 */
export const BuilderAssistantCursorPreview = () => (
  <div className="flex min-h-[280px] items-center justify-center bg-muted/20 p-10">
    <BuilderAssistantMark assistant="cursor" size="xxl" />
  </div>
);
