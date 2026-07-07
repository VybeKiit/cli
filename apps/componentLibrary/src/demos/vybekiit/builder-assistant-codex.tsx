'use client';

import { BuilderAssistantMark } from '@/components/builder-assistant-mark';

/**
 * Renders the codex assistant mark preview.
 *
 * @returns The rendered assistant mark preview.
 * @example
 * <BuilderAssistantCodexPreview />
 */
export const BuilderAssistantCodexPreview = () => (
  <div className="flex min-h-[280px] items-center justify-center bg-muted/20 p-10">
    <BuilderAssistantMark assistant="codex" size="xxl" />
  </div>
);
