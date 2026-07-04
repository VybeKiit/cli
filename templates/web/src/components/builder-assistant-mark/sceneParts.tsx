/**
 * Illustrated scene primitives for the deluxe Claude octopus scenes.
 *
 * Every part is a pure function returning an SVG `<g>` placed via a
 * `translate(x, y)` (+ optional `scale`) transform, so scenes compose props by
 * position on the shared 320×220 canvas (ground line ≈ y180). Coordinates inside
 * each part are authored around a documented local origin noted on the function.
 */
import type { ReactNode } from 'react';

import { CLAUDE_CODE_BRAND_HEX, CLAUDE_CODE_OCTOPUS_PATH } from './builderAssistantMarkPaths';

export const SCENE_INK = '#3B2A22';
export const SCENE_INK_SOFT = '#6B3D2E';
const ALUMINUM = '#C4C7CC';
const ALUMINUM_DARK = '#9AA0A6';
const SCREEN_DARK = '#1E1E1E';

interface PlacedProps {
  readonly x: number;
  readonly y: number;
  readonly scale?: number;
  readonly className?: string;
}

function place({ x, y, scale = 1 }: { x: number; y: number; scale?: number | undefined }): string {
  return scale === 1 ? `translate(${x} ${y})` : `translate(${x} ${y}) scale(${scale})`;
}

export type OctopusExpression =
  | 'focused'
  | 'happy'
  | 'sleepy'
  | 'shocked'
  | 'sad'
  | 'loving'
  | 'cool';

/**
 * The brand octopus body, scaled from its native 24×24 path. Local origin is the
 * top-left of the 24-unit grid; `size` is the rendered edge length in canvas units.
 * Eye cutouts in the path show the scene through them, so pupils + mouth are drawn
 * on top to give each scene a readable expression.
 */
export function OctopusBody({
  x,
  y,
  size = 64,
  expression = 'focused',
  className,
}: PlacedProps & { readonly size?: number; readonly expression?: OctopusExpression }) {
  const s = size / 24;
  const leftEye = { cx: 6.74, cy: 9.5 };
  const rightEye = { cx: 17.25, cy: 9.5 };

  // Positioning lives on the outer <g> (transform attribute); the animatable
  // class goes on the inner <g> so a CSS transform never clobbers placement.
  return (
    <g transform={place({ x, y, scale: s })}>
      <g
        className={className}
        style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}
      >
        <path d={CLAUDE_CODE_OCTOPUS_PATH} fill={CLAUDE_CODE_BRAND_HEX} fillRule="evenodd" />
        <OctopusFace expression={expression} leftEye={leftEye} rightEye={rightEye} />
      </g>
    </g>
  );
}

function OctopusFace({
  expression,
  leftEye,
  rightEye,
}: {
  readonly expression: OctopusExpression;
  readonly leftEye: { cx: number; cy: number };
  readonly rightEye: { cx: number; cy: number };
}) {
  if (expression === 'sleepy') {
    return (
      <>
        <path
          d={`M${leftEye.cx - 0.9} ${leftEye.cy} q0.9 0.7 1.8 0`}
          fill="none"
          stroke={SCENE_INK}
          strokeLinecap="round"
          strokeWidth="0.5"
        />
        <path
          d={`M${rightEye.cx - 0.9} ${rightEye.cy} q0.9 0.7 1.8 0`}
          fill="none"
          stroke={SCENE_INK}
          strokeLinecap="round"
          strokeWidth="0.5"
        />
      </>
    );
  }

  if (expression === 'cool') {
    return (
      <>
        <rect fill={SCENE_INK} height="1.4" rx="0.3" width="4.4" x="9.9" y="8.7" />
        <rect fill={SCENE_INK} height="0.4" width="1.2" x="11.3" y="8.5" />
      </>
    );
  }

  const pupil = expression === 'shocked' ? 0.95 : 0.7;
  const mouth = octopusMouthPath(expression);

  return (
    <>
      <circle cx={leftEye.cx} cy={leftEye.cy} fill={SCENE_INK} r={pupil} />
      <circle cx={rightEye.cx} cy={rightEye.cy} fill={SCENE_INK} r={pupil} />
      {expression === 'loving' ? (
        <>
          <MiniHeart cx={leftEye.cx} cy={leftEye.cy - 3.4} />
          <MiniHeart cx={rightEye.cx} cy={rightEye.cy - 3.4} />
        </>
      ) : null}
      {mouth}
    </>
  );
}

function octopusMouthPath(expression: OctopusExpression): ReactNode {
  const y = 13;
  if (expression === 'sad') {
    return (
      <path
        d={`M10 ${y + 0.8} Q12 ${y - 0.6} 14 ${y + 0.8}`}
        fill="none"
        stroke={SCENE_INK}
        strokeLinecap="round"
        strokeWidth="0.6"
      />
    );
  }
  if (expression === 'shocked') {
    return <ellipse cx="12" cy={y + 0.4} fill={SCENE_INK} rx="1" ry="1.3" />;
  }
  if (expression === 'happy' || expression === 'loving') {
    return (
      <path
        d={`M9.7 ${y} Q12 ${y + 1.9} 14.3 ${y}`}
        fill="none"
        stroke={SCENE_INK}
        strokeLinecap="round"
        strokeWidth="0.65"
      />
    );
  }
  return (
    <path
      d={`M10.4 ${y + 0.4} H13.6`}
      fill="none"
      stroke={SCENE_INK}
      strokeLinecap="round"
      strokeWidth="0.55"
    />
  );
}

function MiniHeart({ cx, cy }: { readonly cx: number; readonly cy: number }) {
  return (
    <path
      d={`M${cx} ${cy + 0.9} C${cx - 1.1} ${cy - 0.3} ${cx - 0.5} ${cy - 1.2} ${cx} ${cy - 0.4} C${cx + 0.5} ${cy - 1.2} ${cx + 1.1} ${cy - 0.3} ${cx} ${cy + 0.9}Z`}
      fill="#E11D48"
    />
  );
}

/** Desk surface + front edge. Local origin: left end of the desk top. */
export function Desk({
  x,
  y,
  scale,
  className,
  width = 320,
}: PlacedProps & { readonly width?: number }) {
  return (
    <g className={className} transform={place({ x, y, scale })}>
      <rect fill="#B98A6E" height="8" rx="2" width={width} x="0" y="0" />
      <rect fill="#9C6F55" height="10" width={width} x="0" y="8" />
    </g>
  );
}

/**
 * Open MacBook drawn as lid (screen) + hinge + keyboard deck, seen slightly from
 * the front. Local origin: bottom-left corner of the keyboard deck. `screen` fills
 * the display so scenes can theme it (terminal, error, etc.).
 */
export function MacBook({
  x,
  y,
  scale,
  className,
  screen,
  screenGlow = true,
}: PlacedProps & { readonly screen?: ReactNode; readonly screenGlow?: boolean }) {
  return (
    <g className={className} transform={place({ x, y, scale })}>
      {/* keyboard deck (trapezoid base) */}
      <path d="M-4 0 L64 0 L58 -6 L2 -6 Z" fill={ALUMINUM} />
      <path d="M-4 0 L64 0 L63 3 L-3 3 Z" fill={ALUMINUM_DARK} />
      <rect fill="#B4B8BD" height="1.4" rx="0.7" width="20" x="20" y="-4" />
      {/* lid */}
      <g transform="translate(2 -6)">
        <rect fill={ALUMINUM} height="40" rx="2.5" width="56" x="0" y="-40" />
        <rect fill={SCREEN_DARK} height="32" rx="1.4" width="48" x="4" y="-36" />
        {screenGlow ? (
          <rect fill="#5FB4FF" height="32" opacity="0.12" rx="1.4" width="48" x="4" y="-36" />
        ) : null}
        <g transform="translate(4 -36)">{screen}</g>
      </g>
    </g>
  );
}

/**
 * Office chair seen from behind-left, so the octopus sits in front of the back.
 * Local origin: center of the seat cushion top.
 */
export function OfficeChair({ x, y, scale, className }: PlacedProps) {
  return (
    <g className={className} transform={place({ x, y, scale })}>
      {/* backrest */}
      <rect fill="#4B5563" height="46" rx="9" width="46" x="-23" y="-48" />
      <rect fill="#5B636F" height="34" rx="6" width="34" x="-17" y="-44" />
      {/* seat */}
      <ellipse cx="0" cy="2" fill="#374151" rx="30" ry="10" />
      {/* gas column */}
      <rect fill="#6B7280" height="26" width="6" x="-3" y="10" />
      {/* base + wheels */}
      <path
        d="M-26 40 L0 30 L26 40"
        fill="none"
        stroke="#6B7280"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <circle cx="-26" cy="42" fill="#374151" r="4" />
      <circle cx="0" cy="34" fill="#374151" r="4" />
      <circle cx="26" cy="42" fill="#374151" r="4" />
    </g>
  );
}

/** Steaming coffee mug. Local origin: bottom-center of the mug. */
export function CoffeeMug({ x, y, scale, className }: PlacedProps) {
  return (
    <g className={className} transform={place({ x, y, scale })}>
      <path
        className="scene-steam scene-steam--a"
        d="M-3 -18 q-2 -3 0 -6"
        fill="none"
        stroke="#C9B7A8"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        className="scene-steam scene-steam--b"
        d="M2 -18 q2 -3 0 -6"
        fill="none"
        stroke="#C9B7A8"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <rect fill="#E5E7EB" height="14" rx="2" width="14" x="-7" y="-14" />
      <path d="M7 -12 h4 a3 3 0 0 1 0 8 h-4" fill="none" stroke="#E5E7EB" strokeWidth="2" />
      <rect fill={CLAUDE_CODE_BRAND_HEX} height="3" rx="1" width="14" x="-7" y="-14" />
    </g>
  );
}

const CONFETTI_COLORS = ['#FBBF24', '#34D399', '#60A5FA', '#F472B6', '#A855F7', '#FB7185'];

/**
 * A real confetti burst — many particles across the top of the canvas, each with
 * varied color, rotation, and staggered fall timing (CSS drives the fall). Local
 * origin: top-left of the burst area; `width` spans the spread.
 */
export function ConfettiField({
  x,
  y,
  scale,
  className,
  width = 320,
  count = 26,
}: PlacedProps & { readonly width?: number; readonly count?: number }) {
  const bits = Array.from({ length: count }, (_, i) => {
    const px = (i * 61) % width;
    const py = (i * 37) % 40;
    const rot = (i * 47) % 360;
    const size = 3 + (i % 3);
    const round = i % 4 === 0;
    return { i, px, py, rot, size, round, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length] };
  });

  return (
    <g className={className} transform={place({ x, y, scale })}>
      {bits.map((b) => (
        // Outer <g> positions the particle; the animated inner <g> only carries
        // the CSS fall transform; the rect keeps its static rotation attribute.
        <g key={b.i} transform={`translate(${b.px} ${b.py})`}>
          <g
            className={`scene-confetti scene-confetti--${b.i % 6}`}
            style={{ transformBox: 'fill-box' }}
          >
            <rect
              fill={b.color}
              height={b.size}
              rx={b.round ? b.size / 2 : 0.4}
              transform={`rotate(${b.rot})`}
              width={b.size}
              x={-b.size / 2}
              y={-b.size / 2}
            />
          </g>
        </g>
      ))}
    </g>
  );
}

/** Soft radial-ish backdrop panel to give scenes depth. Fills the whole canvas. */
export function SceneBackdrop({
  width = 320,
  height = 220,
  from = '#FFF7F3',
  to = '#FCE9E0',
  id,
}: {
  readonly width?: number;
  readonly height?: number;
  readonly from?: string;
  readonly to?: string;
  readonly id: string;
}) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
      </defs>
      <rect fill={`url(#${id})`} height={height} width={width} x="0" y="0" />
    </>
  );
}
