'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import { CLAUDE_CODE_BRAND_HEX, CLAUDE_CODE_OCTOPUS_EYE_INK } from './builderAssistantMarkPaths';
import { getRigPose, RIG_VIEWBOX, type RigFrame } from './octopusRigKit';
import './octopus-rig.css';

/**
 * Renders any pose from the integer-grid kit: whole-number `<rect>` blocks with
 * `shape-rendering: crispEdges` and a hard frame-swap (no CSS sub-pixel tween),
 * reused/extended from ayotomcs.me/claude-mascot. Motion is discrete — one body
 * frame paints per 1/N slice of the loop — so edges stay razor-sharp at any size.
 */

/** Custom CSS properties (`--rig-*`) need a cast to satisfy `CSSProperties`. */
const rigVars = (vars: Record<string, string | number>): CSSProperties => vars as CSSProperties;

const RigFrameGroup = ({ frame, index }: { readonly frame: RigFrame; readonly index: number }) => (
  <g
    className="octo-rig__frame"
    style={rigVars({ '--rig-i': index })}
    transform={`translate(${frame.tx} ${frame.ty})`}
  >
    {frame.body.map((r) => (
      <rect
        fill={CLAUDE_CODE_BRAND_HEX}
        height={r[3]}
        key={`b-${r[0]}-${r[1]}-${r[2]}-${r[3]}`}
        width={r[2]}
        x={r[0]}
        y={r[1]}
      />
    ))}
    {frame.eyes.map((r) => (
      <rect
        fill={CLAUDE_CODE_OCTOPUS_EYE_INK}
        height={r[3]}
        key={`e-${r[0]}-${r[1]}-${r[2]}-${r[3]}`}
        width={r[2]}
        x={r[0]}
        y={r[1]}
      />
    ))}
    {frame.props?.map((p) => (
      <rect
        className={cn('octo-rig__prop', p.cls)}
        fill={p.fill}
        height={p.rect[3]}
        key={`p-${p.fill}-${p.rect[0]}-${p.rect[1]}-${p.rect[2]}-${p.rect[3]}`}
        width={p.rect[2]}
        x={p.rect[0]}
        y={p.rect[1]}
      />
    ))}
  </g>
);

/**
 * The sharp integer-grid octopus for a migrated pose. Returns `null` for poses
 * not yet on the grid so callers can fall back to the legacy path body.
 *
 * @returns SVG rig for migrated poses, or null when no rig exists.
 * @example
 * <ClaudeOctopusRig pose="celebrating" />;
 */
export const ClaudeOctopusRig = ({
  className,
  pose,
}: {
  readonly className?: string;
  readonly pose: string;
}) => {
  const rig = getRigPose(pose);
  if (!rig) {
    return null;
  }
  const frameCount = rig.frames.length;
  const loopMs = rig.loopMs === undefined ? 1000 : rig.loopMs;

  return (
    <svg
      aria-hidden={true}
      className={cn('octo-rig', `octo-rig--n${frameCount}`, className)}
      shapeRendering="crispEdges"
      style={rigVars({ '--rig-loop': `${loopMs}ms` })}
      viewBox={RIG_VIEWBOX}
    >
      {rig.frames.map((frame, index) => (
        <RigFrameGroup frame={frame} index={index} key={frame.id} />
      ))}
      {rig.accents && rig.accents.length > 0 ? (
        <g className="octo-rig__accents">
          {rig.accents.map((accent) => (
            <rect
              className={cn('octo-rig__accent', accent.cls)}
              fill={accent.fill}
              height={accent.rect[3]}
              key={`a-${accent.fill}-${accent.rect[0]}-${accent.rect[1]}-${accent.rect[2]}-${accent.rect[3]}`}
              width={accent.rect[2]}
              x={accent.rect[0]}
              y={accent.rect[1]}
            />
          ))}
        </g>
      ) : null}
    </svg>
  );
};

/**
 * Proof/hero wrapper for the celebration jump.
 *
 * @returns Celebration jump rig for hero previews.
 * @example
 * <ClaudeOctopusJump />;
 */
export const ClaudeOctopusJump = () => <ClaudeOctopusRig pose="celebrating" />;
