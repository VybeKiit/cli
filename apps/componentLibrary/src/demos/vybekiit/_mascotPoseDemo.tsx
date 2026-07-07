'use client';

import { BuilderAssistantMark } from '@/components/builder-assistant-mark';
import {
  CLAUDE_OCTOPUS_POSES,
  type ClaudeOctopusPose,
} from '@/components/builder-assistant-mark/claudeOctopusPoses';

interface MascotPoseDemoProps {
  readonly pose: ClaudeOctopusPose;
}

const resolvePoseMeta = (pose: ClaudeOctopusPose) => {
  const meta = CLAUDE_OCTOPUS_POSES.find((item) => item.id === pose);
  if (meta === undefined) {
    throw new Error(`Unknown Claude octopus pose: ${pose}`);
  }
  return meta;
};

/**
 * Renders a single Claude mascot pose preview.
 *
 * @param props - Demo props.
 * @returns The rendered pose demo.
 * @example
 * ```tsx
 * <MascotPoseDemo pose="thinking" />
 * ```
 */
export const MascotPoseDemo = ({ pose }: MascotPoseDemoProps) => {
  const meta = resolvePoseMeta(pose);

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 bg-muted/20 p-10">
      <BuilderAssistantMark assistant="claude" pose={pose} size="xxl" />
      <p className="max-w-xs text-center font-medium text-sm">{meta.label}</p>
      <p className="max-w-sm text-center text-muted-foreground text-xs leading-snug">
        {meta.description}
      </p>
    </div>
  );
};
