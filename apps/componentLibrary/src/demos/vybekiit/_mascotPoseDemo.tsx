'use client';

import { BuilderAssistantMark } from '@/components/builder-assistant-mark';
import {
  CLAUDE_OCTOPUS_POSES,
  type ClaudeOctopusPose,
} from '@/components/builder-assistant-mark/claudeOctopusPoses';

export function MascotPoseDemo({ pose }: { readonly pose: ClaudeOctopusPose }) {
  const meta = CLAUDE_OCTOPUS_POSES.find((item) => item.id === pose);

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 bg-muted/20 p-10">
      <BuilderAssistantMark assistant="claude" pose={pose} size="xxl" />
      <p className="max-w-xs text-center font-medium text-sm">{meta?.label ?? pose}</p>
      <p className="max-w-sm text-center text-muted-foreground text-xs leading-snug">
        {meta?.description}
      </p>
    </div>
  );
}
