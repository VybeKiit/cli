'use client';

import { siCursor } from 'simple-icons';
import type { VybeAssistant } from '@vybekiit/report-mode';

import { cn } from '@/lib/utils';

import {
  CLAUDE_CODE_BRAND_HEX,
  CLAUDE_CODE_OCTOPUS_EYE_INK,
  CLAUDE_CODE_OCTOPUS_EYES,
  CLAUDE_CODE_OCTOPUS_PATH,
} from './builderAssistantMarkPaths';
import {
  builderAssistantMarkSizeClass,
  type BuilderAssistantMarkSize,
} from './builderAssistantMarkSizes';
import { ClaudeOctopusOverlays } from './ClaudeOctopusOverlays';
import {
  type AssistantMood,
  type ClaudeOctopusPose,
  resolveClaudeOctopusPose,
} from './claudeOctopusPoses';
import {
  claudeOctopusExtendedAnimClass,
  claudeOctopusExtendedGlowClass,
  CLAUDE_OCTOPUS_EXTENDED_POSES,
  type ClaudeOctopusExtendedPose,
} from './claudeOctopusExtendedPoses';
import { CodexMark } from './CodexMark';
import { ClaudeOctopusRig } from './octopusRig';
import { getRigPose } from './octopusRigKit';
import './builder-assistant-mark.css';

export type { AssistantMood, ClaudeOctopusPose } from './claudeOctopusPoses';
export type { BuilderAssistantMarkSize } from './builderAssistantMarkSizes';
export {
  CLAUDE_OCTOPUS_POSES,
  CLAUDE_OCTOPUS_POSE_IDS,
  claudeOctopusPoseDemoName,
  resolveClaudeOctopusPose,
} from './claudeOctopusPoses';
export {
  BUILDER_ASSISTANT_MARK_SIZE_LABELS,
  BUILDER_ASSISTANT_MARK_SIZES,
  builderAssistantMarkSizeClass,
} from './builderAssistantMarkSizes';

export const ASSISTANT_LABELS: Record<VybeAssistant, string> = {
  claude: 'Claude Code',
  codex: 'Codex',
  cursor: 'Cursor',
};

const EXTENDED_POSES = CLAUDE_OCTOPUS_EXTENDED_POSES as readonly ClaudeOctopusExtendedPose[];

const CLOSED_EYE_POSES: ReadonlySet<ClaudeOctopusPose> = new Set([
  'sleeping',
  'manifesting',
  'facepalm',
  'meditating',
  ...EXTENDED_POSES.filter((pose) => pose.closedEyes).map((pose) => pose.id as ClaudeOctopusPose),
]);
const SQUINT_EYE_POSES: ReadonlySet<ClaudeOctopusPose> = new Set([
  'debugging',
  'reviewing',
  'scrolling',
  ...EXTENDED_POSES.filter((pose) => pose.squintEyes).map((pose) => pose.id as ClaudeOctopusPose),
]);
const DROOPY_EYE_POSES: ReadonlySet<ClaudeOctopusPose> = new Set([
  'sad',
  'tired',
  ...EXTENDED_POSES.filter((pose) => pose.droopyEyes).map((pose) => pose.id as ClaudeOctopusPose),
]);
const CUSTOM_EYE_POSES: ReadonlySet<ClaudeOctopusPose> = new Set([
  'broke',
  'unhinged',
  ...EXTENDED_POSES.filter((pose) => pose.customEyes).map((pose) => pose.id as ClaudeOctopusPose),
]);

const POSE_GLOW: Partial<Record<ClaudeOctopusPose, string>> = {
  alive: 'builder-assistant-mark--active',
  working: 'builder-assistant-mark--working',
  sad: 'builder-assistant-mark--sad',
  celebrating: 'builder-assistant-mark--celebrate',
  micdrop: 'builder-assistant-mark--celebrate',
  rich: 'builder-assistant-mark--celebrate',
  eureka: 'builder-assistant-mark--celebrate',
  loving: 'builder-assistant-mark--love',
  vibing: 'builder-assistant-mark--vibe',
  summoning: 'builder-assistant-mark--vibe',
  manifesting: 'builder-assistant-mark--vibe',
  panicking: 'builder-assistant-mark--panic',
  hotfix: 'builder-assistant-mark--panic',
  unhinged: 'builder-assistant-mark--panic',
  broke: 'builder-assistant-mark--panic',
  ghosting: 'builder-assistant-mark--sleep',
  streaking: 'builder-assistant-mark--celebrate',
  flexing: 'builder-assistant-mark--celebrate',
  deploying: 'builder-assistant-mark--deploy',
  sleeping: 'builder-assistant-mark--sleep',
  tired: 'builder-assistant-mark--sleep',
};

interface BuilderAssistantMarkProps {
  readonly assistant: VybeAssistant;
  readonly pose?: ClaudeOctopusPose;
  readonly size?: BuilderAssistantMarkSize;
  /** @deprecated Prefer `pose="alive"`. */
  readonly active?: boolean;
  /** @deprecated Prefer `pose="working"`. */
  readonly working?: boolean;
  /** @deprecated Prefer `pose="sad"`. */
  readonly mood?: AssistantMood;
  readonly className?: string;
}

function markShellClass(
  size: BuilderAssistantMarkSize,
  className?: string,
  ...parts: Array<string | false | undefined>
) {
  return cn('builder-assistant-mark', builderAssistantMarkSizeClass(size), ...parts, className);
}

function ClaudeCodeOctopusMark({
  pose: poseProp,
  size = 's',
  active = false,
  working = false,
  mood = 'default',
  className,
}: {
  readonly pose?: ClaudeOctopusPose;
  readonly size?: BuilderAssistantMarkSize;
  readonly active?: boolean;
  readonly working?: boolean;
  readonly mood?: AssistantMood;
  readonly className?: string | undefined;
}) {
  const pose = resolveClaudeOctopusPose({
    ...(poseProp === undefined ? {} : { pose: poseProp }),
    active,
    working,
    mood,
  });
  const { left, right } = CLAUDE_CODE_OCTOPUS_EYES;
  // The black eye ink sits a touch larger than the path's cutout so a gaze
  // shift (the `.claude-octopus__eye` transforms) never exposes the cream hole.
  const EYE_INK_PAD = 0.5;
  const padEye = (e: { x: number; y: number; width: number; height: number }) => ({
    x: e.x - EYE_INK_PAD,
    y: e.y - EYE_INK_PAD,
    width: e.width + EYE_INK_PAD * 2,
    height: e.height + EYE_INK_PAD * 2,
  });
  const leftEye = padEye(left);
  const rightEye = padEye(right);
  const showFace = pose !== 'idle';
  const customEyes = CUSTOM_EYE_POSES.has(pose);
  const closedEyes = CLOSED_EYE_POSES.has(pose);
  const squintEyes = SQUINT_EYE_POSES.has(pose);
  const droopyEyes = DROOPY_EYE_POSES.has(pose);

  const poseGlow = POSE_GLOW[pose] ?? claudeOctopusExtendedGlowClass(pose);
  // Poses migrated to the integer grid render the sharp rig; the rest keep the
  // legacy 24-unit path body until their batch lands (additive migration).
  const rig = getRigPose(pose);

  return (
    <span
      className={markShellClass(
        size,
        className,
        'builder-assistant-mark--claude',
        showFace && poseGlow,
      )}
      role="img"
      aria-hidden={true}
    >
      {rig ? (
        <ClaudeOctopusRig pose={pose} />
      ) : (
        <svg
          aria-hidden={true}
          className={cn(
            'claude-octopus',
            `claude-octopus--${pose}`,
            claudeOctopusExtendedAnimClass(pose),
          )}
          viewBox="0 0 24 24"
        >
          <g className="claude-octopus__stage">
            <path d={CLAUDE_CODE_OCTOPUS_PATH} fill={CLAUDE_CODE_BRAND_HEX} fillRule="evenodd" />
            {showFace ? (
              <>
                {customEyes ? null : (
                  <>
                    <g className="claude-octopus__eye claude-octopus__eye--left">
                      <rect
                        className="claude-octopus__eye-ink"
                        fill={CLAUDE_CODE_OCTOPUS_EYE_INK}
                        height={leftEye.height}
                        width={leftEye.width}
                        x={leftEye.x}
                        y={leftEye.y}
                      />
                      <rect
                        className={cn(
                          'claude-octopus__eyelid claude-octopus__eyelid--left',
                          closedEyes && 'claude-octopus__eyelid--closed',
                          squintEyes && 'claude-octopus__eyelid--squint',
                          droopyEyes && 'claude-octopus__eyelid--droopy',
                        )}
                        fill={CLAUDE_CODE_BRAND_HEX}
                        height={leftEye.height}
                        width={leftEye.width}
                        x={leftEye.x}
                        y={leftEye.y}
                      />
                    </g>
                    <g className="claude-octopus__eye claude-octopus__eye--right">
                      <rect
                        className="claude-octopus__eye-ink"
                        fill={CLAUDE_CODE_OCTOPUS_EYE_INK}
                        height={rightEye.height}
                        width={rightEye.width}
                        x={rightEye.x}
                        y={rightEye.y}
                      />
                      <rect
                        className={cn(
                          'claude-octopus__eyelid claude-octopus__eyelid--right',
                          closedEyes && 'claude-octopus__eyelid--closed',
                          squintEyes && 'claude-octopus__eyelid--squint',
                          droopyEyes && 'claude-octopus__eyelid--droopy',
                        )}
                        fill={CLAUDE_CODE_BRAND_HEX}
                        height={rightEye.height}
                        width={rightEye.width}
                        x={rightEye.x}
                        y={rightEye.y}
                      />
                    </g>
                  </>
                )}
                <ClaudeOctopusOverlays pose={pose} />
              </>
            ) : null}
          </g>
        </svg>
      )}
    </span>
  );
}

/** Official SVG marks for Cursor, Claude Code TUI octopus, and Codex CLI cloud. */
export function BuilderAssistantMark({
  assistant,
  pose,
  size = 's',
  active = false,
  working = false,
  mood = 'default',
  className,
}: BuilderAssistantMarkProps) {
  if (assistant === 'cursor') {
    return (
      <span
        className={markShellClass(
          size,
          className,
          'builder-assistant-mark--cursor',
          active && 'builder-assistant-mark--active',
        )}
        role="img"
        aria-hidden={true}
      >
        <svg aria-hidden={true} fill="currentColor" viewBox="0 0 24 24">
          <path d={siCursor.path} />
        </svg>
      </span>
    );
  }

  if (assistant === 'claude') {
    return (
      <ClaudeCodeOctopusMark
        active={active}
        {...(className === undefined ? {} : { className })}
        mood={mood}
        {...(pose === undefined ? {} : { pose })}
        size={size}
        working={working}
      />
    );
  }

  return (
    <span
      className={markShellClass(
        size,
        className,
        'builder-assistant-mark--codex',
        active && 'builder-assistant-mark--active',
      )}
      role="img"
      aria-hidden={true}
    >
      <CodexMark className="builder-assistant-mark__codex-svg" />
    </span>
  );
}

export function assistantLabel(assistant: VybeAssistant): string {
  return ASSISTANT_LABELS[assistant];
}
