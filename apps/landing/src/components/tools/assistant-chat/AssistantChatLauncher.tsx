'use client';

import type { VybeAssistant } from '@vybekiit/report-mode';
import { assistantLabel } from '@vybekiit-template-web/components/builder-assistant-mark';
import { useEffect, useState } from 'react';

import { VybeLogoIcon } from '@/components/ui/CustomIcons';
import { cn } from '@/lib/utils';

import { AssistantChatPanel } from './AssistantChatPanel';

interface AssistantChatLauncherProps {
  readonly assistant: VybeAssistant;
  readonly bridgeUrl: string;
  readonly referralCode?: string;
}

/** Floating toggle that opens the dev chat sidebar. Client-only, dev-only mount. */
export const AssistantChatLauncher = ({
  assistant,
  bridgeUrl,
  referralCode,
}: AssistantChatLauncherProps) => {
  const [open, setOpen] = useState(false);

  // Warm the coding helper as soon as the launcher mounts so open feels instant.
  useEffect(() => {
    void fetch('/api/dev/ensure-bridge', { method: 'POST' }).catch(() => {
      // Panel will retry / show offline empty if this fails.
    });
  }, []);

  if (open) {
    return (
      <AssistantChatPanel
        bridgeUrl={bridgeUrl}
        defaultAssistant={assistant}
        onClose={() => setOpen(false)}
        {...(referralCode ? { referralCode } : {})}
      />
    );
  }

  return (
    <button
      aria-label={`Open chat with ${assistantLabel(assistant)}`}
      className={cn(
        'fixed right-4 bottom-4 z-[2147483000] flex items-center gap-2 rounded-full',
        'border border-border bg-background px-4 py-2.5 font-medium text-foreground text-sm',
        'shadow-lg transition-shadow hover:shadow-xl',
      )}
      onClick={() => setOpen(true)}
      type="button"
    >
      <VybeLogoIcon className="size-5" />
      Ask {assistantLabel(assistant)}
    </button>
  );
};
