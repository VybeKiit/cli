'use client';

import { cn } from '@/lib/utils';

import {
  claudeOctopusScene,
  SCENE_WORLD,
  sceneFocusOrFull,
  type SceneFocus,
} from './claudeOctopusScenes';
import './builder-assistant-scenes.css';

export type SceneCanvas = 'wide' | 'square' | 'inline';

export interface ClaudeOctopusSceneProps {
  readonly scene: string;
  /** wide = full landscape · square = centered crop · inline = tight on the hero. */
  readonly canvas?: SceneCanvas;
  readonly className?: string;
}

/** Clamp a focus-derived crop so it never runs past the 320×220 world edges. */
function cropToWorld(x: number, y: number, w: number, h: number): string {
  const cx = Math.max(0, Math.min(x, SCENE_WORLD.width - w));
  const cy = Math.max(0, Math.min(y, SCENE_WORLD.height - h));
  return `${cx} ${cy} ${w} ${h}`;
}

function viewBoxFor(canvas: SceneCanvas, focus: SceneFocus): string {
  if (canvas === 'wide') {
    return `0 0 ${SCENE_WORLD.width} ${SCENE_WORLD.height}`;
  }
  const centerX = focus.x + focus.w / 2;
  const centerY = focus.y + focus.h / 2;
  if (canvas === 'square') {
    const side = Math.min(SCENE_WORLD.height, Math.max(focus.w, focus.h) + 24);
    return cropToWorld(centerX - side / 2, centerY - side / 2, side, side);
  }
  // inline — tight framing on the hero focus region
  return cropToWorld(focus.x, focus.y, focus.w, focus.h);
}

const CANVAS_MAX_WIDTH: Record<SceneCanvas, string> = {
  wide: '100%',
  square: '260px',
  inline: '120px',
};

/**
 * Renders a deluxe Claude octopus scene. The illustration is authored once in the
 * 320×220 world; `canvas` only reframes the viewBox, so one scene serves the wide
 * marketing shot, a square card, and a tight inline thumbnail.
 */
export function ClaudeOctopusScene({ scene, canvas = 'wide', className }: ClaudeOctopusSceneProps) {
  const def = claudeOctopusScene(scene);
  if (!def) {
    return null;
  }
  const viewBox = viewBoxFor(canvas, sceneFocusOrFull(scene));

  return (
    <svg
      aria-label={def.label}
      className={cn('claude-scene', `claude-scene--${scene}`, `claude-scene--${canvas}`, className)}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      style={{ width: '100%', height: 'auto', maxWidth: CANVAS_MAX_WIDTH[canvas] }}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{def.description}</title>
      {def.render()}
    </svg>
  );
}
