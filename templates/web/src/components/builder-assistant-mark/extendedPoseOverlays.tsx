/**
 * Bespoke inline overlays for the data-driven extended poses.
 *
 * Each extended pose used to render the same corner emoji glyph + one of eight
 * shared body animations, so dozens looked identical. This module gives every
 * extended pose a hand-drawn SVG overlay (composed from the primitive kit below)
 * plus its own motion, authored in the shared 24×24 icon viewBox that the mark
 * uses. `ClaudeOctopusOverlays` consults `extendedPoseOverlay(id)` before falling
 * back to the emoji, so the migration is incremental and never breaks the build.
 *
 * Coordinate conventions (matching the hand-authored core poses):
 *  - corner props sit top-right around x≈18–22, y≈3–9
 *  - facial features sit over the eyes (y≈9–10) or mouth (y≈12–13)
 *  - desk/floor props sit along the bottom around y≈16–20
 * Motion is baked into each primitive (a gear spins, a flame flickers) and driven
 * by keyframes in `builder-assistant-mark.css`, all reduced-motion guarded.
 */
import type { ReactNode } from 'react';

const INK = '#6B3D2E';

/** Shared prop shape for corner primitives positioned by translate. */
interface XY {
  readonly x: number;
  readonly y: number;
}

// ————————————————————————————————————————————————————————————————
// Primitive kit — small pure parts, positioned by translate, motion baked in
// ————————————————————————————————————————————————————————————————

/** Lightbulb with radiating rays. Local origin: bulb center. */
const Bulb = ({
  x,
  y,
  r = 1.35,
}: {
  readonly x: number;
  readonly y: number;
  readonly r?: number;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-rays" stroke="#FBBF24" strokeLinecap="round" strokeWidth="0.3">
      <line x1="0" x2="0" y1={-r - 1.1} y2={-r - 0.4} />
      <line x1={-r - 0.9} x2={-r - 0.3} y1={-0.4} y2={-0.2} />
      <line x1={r + 0.9} x2={r + 0.3} y1={-0.4} y2={-0.2} />
    </g>
    <circle className="claude-octopus__x-bulb" cx="0" cy="0" fill="#FBBF24" r={r} />
    <rect fill="#78716C" height="0.7" rx="0.1" width={r * 0.8} x={-r * 0.4} y={r - 0.1} />
  </g>
);

/** Toothed cog that spins. Local origin: cog center. */
const Gear = ({ x, y }: { readonly x: number; readonly y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-gear">
      <path
        d="M0 -1.7 L0.5 -1.5 L0.9 -1.9 L1.5 -1.3 L1.2 -0.8 L1.6 -0.4 L1.7 0.3 L1.1 0.6 L1.2 1.2 L0.5 1.5 L0.1 1.9 L-0.5 1.5 L-1.1 1.7 L-1.5 1.1 L-1.9 0.7 L-1.5 0.1 L-1.7 -0.5 L-1.1 -0.9 L-1.2 -1.4 Z"
        fill="#78716C"
      />
      <circle cx="0" cy="0" fill="#FAFAF9" r="0.65" />
    </g>
  </g>
);

/** Curling flame. Local origin: flame base. */
const Flame = ({
  x,
  y,
  fill = '#F97316',
  cls = '',
}: {
  readonly x: number;
  readonly y: number;
  readonly fill?: string;
  readonly cls?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      className={`claude-octopus__x-flame ${cls}`}
      d="M0 0 Q0.9 -1.4 0.4 -2.8 Q1.6 -1.9 1.2 -0.3 Q0.7 0.6 0 0Z"
      fill={fill}
    />
  </g>
);

/** Rising bar chart (three bars). Local origin: baseline left. */
const Bars = ({ x, y }: { readonly x: number; readonly y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      className="claude-octopus__x-bar claude-octopus__x-bar--1"
      fill="#60A5FA"
      height="1.6"
      rx="0.1"
      width="0.9"
      x="0"
      y="-1.6"
    />
    <rect
      className="claude-octopus__x-bar claude-octopus__x-bar--2"
      fill="#34D399"
      height="2.6"
      rx="0.1"
      width="0.9"
      x="1.2"
      y="-2.6"
    />
    <rect
      className="claude-octopus__x-bar claude-octopus__x-bar--3"
      fill="#FBBF24"
      height="3.6"
      rx="0.1"
      width="0.9"
      x="2.4"
      y="-3.6"
    />
  </g>
);

/** Magnifier (ring + handle). Local origin: lens center. */
const Magnifier = ({ x, y }: { readonly x: number; readonly y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-loupe">
      <circle cx="0" cy="0" fill="rgba(96,165,250,0.18)" r="1.5" stroke={INK} strokeWidth="0.4" />
      <line
        stroke={INK}
        strokeLinecap="round"
        strokeWidth="0.5"
        x1="1.1"
        x2="2.3"
        y1="1.1"
        y2="2.3"
      />
    </g>
  </g>
);

/** Page with text lines. Local origin: top-left of the page. */
const Doc = ({
  x,
  y,
  accent = '#60A5FA',
}: {
  readonly x: number;
  readonly y: number;
  readonly accent?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      fill="#FAFAF9"
      height="4"
      rx="0.3"
      stroke="#A8A29E"
      strokeWidth="0.2"
      width="3.2"
      x="0"
      y="0"
    />
    <rect fill={accent} height="0.4" rx="0.1" width="2" x="0.6" y="0.9" />
    <rect fill="#A8A29E" height="0.35" rx="0.1" width="2.2" x="0.6" y="1.9" />
    <rect
      className="claude-octopus__x-writeline"
      fill="#A8A29E"
      height="0.35"
      rx="0.1"
      width="2.2"
      x="0.6"
      y="2.7"
    />
  </g>
);

/** Concentric radar pings that expand. Local origin: emitter. */
const Radar = ({ x, y }: { readonly x: number; readonly y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="0" cy="0" fill="#22C55E" r="0.5" />
    <circle
      className="claude-octopus__x-ping claude-octopus__x-ping--1"
      cx="0"
      cy="0"
      fill="none"
      r="1"
      stroke="#22C55E"
      strokeWidth="0.3"
    />
    <circle
      className="claude-octopus__x-ping claude-octopus__x-ping--2"
      cx="0"
      cy="0"
      fill="none"
      r="1"
      stroke="#22C55E"
      strokeWidth="0.3"
    />
  </g>
);

/** Warning triangle that blinks. Local origin: triangle centroid. */
const Siren = ({
  x,
  y,
  fill = '#EF4444',
}: {
  readonly x: number;
  readonly y: number;
  readonly fill?: string;
}) => (
  <g className="claude-octopus__x-siren" transform={`translate(${x} ${y})`}>
    <path
      d="M0 -1.8 L1.9 1.6 H-1.9 Z"
      fill={fill}
      stroke="#B91C1C"
      strokeLinejoin="round"
      strokeWidth="0.2"
    />
    <rect fill="#fff" height="1.1" rx="0.15" width="0.4" x="-0.2" y="-0.7" />
    <circle cx="0" cy="1" fill="#fff" r="0.25" />
  </g>
);

/** Test tube with rising bubbles. Local origin: tube top-center. */
const Beaker = ({ x, y }: { readonly x: number; readonly y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-0.7 0 V2.4 Q-0.7 3.4 0 3.4 Q0.7 3.4 0.7 2.4 V0"
      fill="none"
      stroke={INK}
      strokeWidth="0.35"
    />
    <path d="M-0.7 1.9 Q0 2.3 0.7 1.9 V2.4 Q0.7 3.4 0 3.4 Q-0.7 3.4 -0.7 2.4Z" fill="#34D399" />
    <circle
      className="claude-octopus__x-bubble claude-octopus__x-bubble--1"
      cx="-0.2"
      cy="2.4"
      fill="#A7F3D0"
      r="0.2"
    />
    <circle
      className="claude-octopus__x-bubble claude-octopus__x-bubble--2"
      cx="0.3"
      cy="2.6"
      fill="#A7F3D0"
      r="0.15"
    />
    <rect fill={INK} height="0.3" rx="0.1" width="2" x="-1" y="-0.15" />
  </g>
);

/** Four-point sparkle. Local origin: sparkle center. */
const Spark = ({
  x,
  y,
  s = 1,
  fill = '#FBBF24',
  cls = '',
}: {
  readonly x: number;
  readonly y: number;
  readonly s?: number;
  readonly fill?: string;
  readonly cls?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      className={`claude-octopus__x-spark ${cls}`}
      d={`M0 ${-1.1 * s} Q0.25 ${-0.25 * s} ${1.1 * s} 0 Q0.25 ${0.25 * s} 0 ${1.1 * s} Q-0.25 ${0.25 * s} ${-1.1 * s} 0 Q-0.25 ${-0.25 * s} 0 ${-1.1 * s}Z`}
      fill={fill}
    />
  </g>
);

/** Five-point star. Local origin: star center. */
const Star = ({
  x,
  y,
  r = 1.5,
  fill = '#FBBF24',
  cls = 'claude-octopus__x-star',
}: {
  readonly x: number;
  readonly y: number;
  readonly r?: number;
  readonly fill?: string;
  readonly cls?: string;
}) => {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const ao = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    return `${(Math.cos(ao) * r).toFixed(2)} ${(Math.sin(ao) * r).toFixed(2)}`;
  }).join(' L');
  return (
    <g transform={`translate(${x} ${y})`}>
      <path className={cls} d={`M${pts}Z`} fill={fill} />
    </g>
  );
};

/** Two-branch git graph with a merge/commit node. Local origin: node center. */
const GitNode = ({
  x,
  y,
  color = '#22C55E',
}: {
  readonly x: number;
  readonly y: number;
  readonly color?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M-1.8 1.8 Q-1.8 0 0 0 Q1.8 0 1.8 1.8" fill="none" stroke={INK} strokeWidth="0.35" />
    <circle cx="-1.8" cy="1.8" fill="#8B5CF6" r="0.5" />
    <circle cx="1.8" cy="1.8" fill="#60A5FA" r="0.5" />
    <circle className="claude-octopus__x-node" cx="0" cy="0" fill={color} r="0.6" />
  </g>
);

/** Shipping box / package. Local origin: box top-left. */
const Box = ({
  x,
  y,
  fill = '#C19A6B',
}: {
  readonly x: number;
  readonly y: number;
  readonly fill?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect fill={fill} height="3" rx="0.2" width="3.4" x="0" y="0" />
    <rect fill="#A87F52" height="3" width="1.2" x="1.1" y="0" />
    <rect fill="#8C6239" height="0.7" width="3.4" x="0" y="0" />
  </g>
);

/** Flag on a pole that waves. Local origin: pole base. */
const Flag = ({
  x,
  y,
  fill = '#EF4444',
}: {
  readonly x: number;
  readonly y: number;
  readonly fill?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <line stroke={INK} strokeLinecap="round" strokeWidth="0.35" x1="0" x2="0" y1="0" y2="-3.6" />
    <path
      className="claude-octopus__x-flag"
      d="M0 -3.4 Q1 -3 2 -3.4 Q1.6 -2.6 2 -1.8 Q1 -2.2 0 -1.8Z"
      fill={fill}
    />
  </g>
);

/** Smiling / flat / frowning mouth. Local origin: mouth center (~12,13). */
const Mouth = ({ mood = 'smile' }: { readonly mood?: 'smile' | 'flat' | 'frown' | 'open' }) => {
  if (mood === 'open') {
    return <ellipse cx="12" cy="13" fill={INK} rx="0.9" ry="0.7" />;
  }
  if (mood === 'flat') {
    return (
      <path d="M10.4 13 H13.6" fill="none" stroke={INK} strokeLinecap="round" strokeWidth="0.55" />
    );
  }
  const d = mood === 'frown' ? 'M10.3 13.4 Q12 12.3 13.7 13.4' : 'M10.3 12.7 Q12 14 13.7 12.7';
  return <path d={d} fill="none" stroke={INK} strokeLinecap="round" strokeWidth="0.55" />;
};

/** Little person (head + shoulders). Local origin: head center. */
const Person = ({
  x,
  y,
  fill = INK,
}: {
  readonly x: number;
  readonly y: number;
  readonly fill?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="0" cy="0" fill={fill} r="0.85" />
    <path d="M-1.5 3 Q-1.5 1 0 1 Q1.5 1 1.5 3Z" fill={fill} />
  </g>
);

/** Open book. Local origin: spine top. */
const Book = ({ x, y }: { readonly x: number; readonly y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M0 0 Q-1.8 -0.6 -3 0 V3.4 Q-1.8 2.8 0 3.4Z"
      fill="#FAFAF9"
      stroke="#A8A29E"
      strokeWidth="0.2"
    />
    <path
      d="M0 0 Q1.8 -0.6 3 0 V3.4 Q1.8 2.8 0 3.4Z"
      fill="#F5F5F4"
      stroke="#A8A29E"
      strokeWidth="0.2"
    />
    <line stroke="#A8A29E" strokeWidth="0.18" x1="-2.4" x2="-0.6" y1="1.1" y2="0.9" />
    <line stroke="#A8A29E" strokeWidth="0.18" x1="0.6" x2="2.4" y1="0.9" y2="1.1" />
  </g>
);

/** Curled scroll. Local origin: top-left. */
const Scroll = ({ x, y }: { readonly x: number; readonly y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M0 0.5 Q0 -0.4 0.9 -0.4 H3 Q2.2 -0.4 2.2 0.5 V3.4 Q2.2 4.3 1.3 4.3 H-0.6 Q0 4.3 0 3.4Z"
      fill="#FAF0DC"
      stroke="#D8B892"
      strokeWidth="0.2"
    />
    <line stroke="#B58A5E" strokeWidth="0.2" x1="0.6" x2="1.8" y1="1.3" y2="1.3" />
    <line stroke="#B58A5E" strokeWidth="0.2" x1="0.6" x2="1.8" y1="2.1" y2="2.1" />
  </g>
);

/** Version/price tag that swings from its pin hole. Local origin: pin hole. */
const Tag = ({
  x,
  y,
  fill = '#8B5CF6',
}: {
  readonly x: number;
  readonly y: number;
  readonly fill?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-swing">
      <path d="M-1.2 -1.2 H1.2 V1 L0 2.3 L-1.2 1 Z" fill={fill} />
      <circle cx="0" cy="-0.5" fill="#FAFAF9" r="0.35" />
    </g>
  </g>
);

/** Chat bubble with three typing dots. Local origin: top-left. */
const ChatBubble = ({
  x,
  y,
  fill = '#60A5FA',
}: {
  readonly x: number;
  readonly y: number;
  readonly fill?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M0 0.6 Q0 0 0.6 0 H4 Q4.6 0 4.6 0.6 V2.4 Q4.6 3 4 3 H1.6 L0.6 3.9 L0.8 3 Q0 3 0 2.4Z"
      fill={fill}
    />
    <circle
      className="claude-octopus__x-dot claude-octopus__x-dot--1"
      cx="1.3"
      cy="1.5"
      fill="#fff"
      r="0.3"
    />
    <circle
      className="claude-octopus__x-dot claude-octopus__x-dot--2"
      cx="2.3"
      cy="1.5"
      fill="#fff"
      r="0.3"
    />
    <circle
      className="claude-octopus__x-dot claude-octopus__x-dot--3"
      cx="3.3"
      cy="1.5"
      fill="#fff"
      r="0.3"
    />
  </g>
);

/** Crescent moon. Local origin: moon center. */
const Moon = ({ x, y }: { readonly x: number; readonly y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0.8 -1.6 A1.9 1.9 0 1 0 0.8 1.6 A1.5 1.5 0 1 1 0.8 -1.6Z" fill="#FBBF24" />
  </g>
);

/** Bold directional arrow. Local origin: arrow center. */
const CHEVRON_ROTATIONS = {
  down: 90,
  left: 0,
  right: 0,
  up: -90,
} as const;

const Chevron = ({
  x,
  y,
  dir = 'right',
  color = INK,
}: {
  readonly x: number;
  readonly y: number;
  readonly dir?: 'right' | 'left' | 'up' | 'down';
  readonly color?: string;
}) => {
  const rot = CHEVRON_ROTATIONS[dir];
  const flip = dir === 'left' ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip} 1)`}>
      <path
        d="M-0.8 -1.4 L1 0 L-0.8 1.4"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.6"
      />
    </g>
  );
};

// ————————————————————————————————————————————————————————————————
// Primitive kit — batch 2 (ops / infra / gaming vibe props)
// ————————————————————————————————————————————————————————————————

/** Diagonal pencil. Local origin: mid-body. */
const Pencil = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y}) rotate(45)`}>
    <rect fill="#FBBF24" height="1.1" width="2.6" x="-1.6" y="-0.55" />
    <rect fill="#F5C6A5" height="1.1" width="0.5" x="-2.1" y="-0.55" />
    <path d="M1 -0.55 L1.9 0 L1 0.55Z" fill="#F59E0B" />
    <path d="M1.5 -0.28 L1.9 0 L1.5 0.28Z" fill="#44403C" />
  </g>
);

/** Puffy cloud. Local origin: cloud center. */
const Cloud = ({
  x,
  y,
  fill = '#DBEAFE',
  cls = '',
}: XY & { readonly fill?: string; readonly cls?: string }) => (
  <g className={cls} transform={`translate(${x} ${y})`}>
    <circle cx="-1" cy="0.2" fill={fill} r="0.95" />
    <circle cx="0.1" cy="-0.5" fill={fill} r="1.15" />
    <circle cx="1.1" cy="0.1" fill={fill} r="0.9" />
    <rect fill={fill} height="1" rx="0.5" width="3" x="-1.5" y="0" />
  </g>
);

/** Shield with optional check. Local origin: shield center. */
const Shield = ({
  x,
  y,
  fill = '#60A5FA',
  check = true,
}: XY & { readonly fill?: string; readonly check?: boolean }) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M0 -1.9 L1.7 -1.2 V0.3 Q1.7 1.8 0 2.3 Q-1.7 1.8 -1.7 0.3 V-1.2Z"
      fill={fill}
      stroke="#2563EB"
      strokeWidth="0.2"
    />
    {check ? (
      <path
        d="M-0.8 0.1 L-0.2 0.8 L0.9 -0.7"
        fill="none"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.45"
      />
    ) : null}
  </g>
);

/** Padlock. Local origin: body center. */
const Lock = ({
  x,
  y,
  fill = '#22C55E',
  cls = '',
}: XY & { readonly fill?: string; readonly cls?: string }) => (
  <g className={cls} transform={`translate(${x} ${y})`}>
    <path
      d="M-0.9 -0.4 V-1.2 A0.9 0.9 0 0 1 0.9 -1.2 V-0.4"
      fill="none"
      stroke="#57534E"
      strokeWidth="0.35"
    />
    <rect fill={fill} height="2" rx="0.3" width="2.4" x="-1.2" y="-0.4" />
    <circle cx="0" cy="0.4" fill="#1C1917" r="0.28" />
    <rect fill="#1C1917" height="0.6" width="0.3" x="-0.15" y="0.5" />
  </g>
);

/** Notification bell that swings. Local origin: bell center. */
const Bell = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-swing">
      <path
        d="M0 -1.9 Q0.4 -1.9 0.4 -1.5 Q1.6 -1 1.6 0.6 H-1.6 Q-1.6 -1 -0.4 -1.5 Q-0.4 -1.9 0 -1.9Z"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="0.2"
      />
      <path d="M-1.9 0.6 H1.9" stroke="#D97706" strokeLinecap="round" strokeWidth="0.3" />
      <circle cx="0" cy="1.2" fill="#D97706" r="0.35" />
    </g>
  </g>
);

/** Docker-style whale with a spout puff. Local origin: body center. */
const Whale = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <circle
      className="claude-octopus__x-bubble claude-octopus__x-bubble--1"
      cx="0"
      cy="-1.5"
      fill="#93C5FD"
      r="0.22"
    />
    <path
      d="M-2 0 Q-2.2 -1.4 -0.6 -1.4 Q1.6 -1.5 2.1 0.2 Q2.3 0.9 1.6 1 H-1.4 Q-2 0.9 -2 0Z"
      fill="#3B82F6"
    />
    <path d="M1.7 0.1 Q2.6 -0.4 2.7 0.6 Q2.4 0.9 1.7 0.9Z" fill="#2563EB" />
    <circle cx="-1.1" cy="-0.3" fill="#fff" r="0.2" />
  </g>
);

/** Ship's helm that spins. Local origin: wheel center. */
const Helm = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-gear" stroke="#0EA5E9" strokeLinecap="round" strokeWidth="0.3">
      <circle cx="0" cy="0" fill="none" r="1.5" strokeWidth="0.35" />
      <line x1="0" x2="0" y1="-1.9" y2="1.9" />
      <line x1="-1.9" x2="1.9" y1="0" y2="0" />
      <line x1="-1.35" x2="1.35" y1="-1.35" y2="1.35" />
      <line x1="-1.35" x2="1.35" y1="1.35" y2="-1.35" />
      <circle cx="0" cy="0" fill="#0EA5E9" r="0.5" stroke="none" />
    </g>
  </g>
);

/** Hourglass with a falling grain. Local origin: glass center. */
const Hourglass = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-1.1 -1.7 H1.1 M-1.1 1.7 H1.1"
      stroke="#78716C"
      strokeLinecap="round"
      strokeWidth="0.35"
    />
    <path
      d="M-1 -1.7 Q-1 -0.3 0 0 Q-1 0.3 -1 1.7 M1 -1.7 Q1 -0.3 0 0 Q1 0.3 1 1.7"
      fill="none"
      stroke="#78716C"
      strokeWidth="0.3"
    />
    <path d="M-0.7 -1.5 Q0 -0.3 0.7 -1.5Z" fill="#FBBF24" />
    <path d="M-0.55 1.5 Q0 0.6 0.55 1.5Z" fill="#FBBF24" />
    <circle className="claude-octopus__x-drip" cx="0" cy="0.2" fill="#FBBF24" r="0.16" />
  </g>
);

/** Skull. Local origin: cranium center. */
const Skull = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-1.5 0.3 A1.5 1.6 0 1 1 1.5 0.3 V1 Q1.5 1.5 1 1.5 H-1 Q-1.5 1.5 -1.5 1Z"
      fill="#F5F5F4"
      stroke="#A8A29E"
      strokeWidth="0.2"
    />
    <circle cx="-0.7" cy="-0.1" fill="#1C1917" r="0.5" />
    <circle cx="0.7" cy="-0.1" fill="#1C1917" r="0.5" />
    <path d="M0 0.4 L-0.3 1 H0.3Z" fill="#1C1917" />
    <path d="M-0.7 1.5 V0.9 M0 1.5 V0.9 M0.7 1.5 V0.9" stroke="#A8A29E" strokeWidth="0.25" />
  </g>
);

/** Crown. Local origin: base center. */
const Crown = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-1.7 1 L-1.7 -1 L-0.6 0 L0 -1.3 L0.6 0 L1.7 -1 L1.7 1Z"
      fill="#FBBF24"
      stroke="#D97706"
      strokeWidth="0.2"
    />
    <circle cx="-1.7" cy="-1" fill="#F59E0B" r="0.28" />
    <circle cx="0" cy="-1.3" fill="#F59E0B" r="0.28" />
    <circle cx="1.7" cy="-1" fill="#F59E0B" r="0.28" />
    <rect fill="#EF4444" height="0.35" width="0.35" x="-0.18" y="0.2" />
  </g>
);

/** Robot head with a blinking antenna. Local origin: head center. */
const Robot = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <line stroke="#78716C" strokeWidth="0.3" x1="0" x2="0" y1="-1.5" y2="-2.2" />
    <circle className="claude-octopus__x-siren" cx="0" cy="-2.4" fill="#EF4444" r="0.35" />
    <rect
      fill="#94A3B8"
      height="2.6"
      rx="0.4"
      stroke="#64748B"
      strokeWidth="0.2"
      width="3.2"
      x="-1.6"
      y="-1.5"
    />
    <circle cx="-0.6" cy="-0.4" fill="#38BDF8" r="0.45" />
    <circle cx="0.6" cy="-0.4" fill="#38BDF8" r="0.45" />
    <path d="M-0.7 0.7 H0.7" stroke="#334155" strokeLinecap="round" strokeWidth="0.3" />
  </g>
);

/** Circled check that pops. Local origin: badge center. */
const Check = ({ x, y, fill = '#22C55E' }: XY & { readonly fill?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-node">
      <circle cx="0" cy="0" fill={fill} r="1.5" />
      <path
        d="M-0.7 0.05 L-0.15 0.7 L0.8 -0.55"
        fill="none"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.4"
      />
    </g>
  </g>
);

/** Jigsaw piece. Local origin: piece center. */
const Puzzle = ({ x, y, fill = '#8B5CF6' }: XY & { readonly fill?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-1.3 -1.3 H-0.4 A0.5 0.5 0 0 1 0.4 -1.3 H1.3 V-0.4 A0.5 0.5 0 0 1 1.3 0.4 V1.3 H-1.3 V0.4 A0.5 0.5 0 0 0 -1.3 -0.4Z"
      fill={fill}
      stroke="#6D28D9"
      strokeWidth="0.2"
    />
  </g>
);

/** Balance scale with a swinging beam. Local origin: post center. */
const Scale = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <line stroke="#78716C" strokeWidth="0.35" x1="0" x2="0" y1="-1.8" y2="1.6" />
    <g className="claude-octopus__x-swing">
      <line
        stroke="#78716C"
        strokeLinecap="round"
        strokeWidth="0.3"
        x1="-1.6"
        x2="1.6"
        y1="-1.4"
        y2="-1.4"
      />
      <path d="M-2.1 -1.4 L-1.1 -1.4 L-1.6 -0.3Z" fill="#FBBF24" />
      <path d="M1.1 -1.4 L2.1 -1.4 L1.6 -0.3Z" fill="#FBBF24" />
    </g>
    <path d="M-0.7 1.6 H0.7" stroke="#78716C" strokeLinecap="round" strokeWidth="0.35" />
  </g>
);

/** Brain. Local origin: brain center. */
const Brain = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-0.2 -1.6 Q-1.8 -1.7 -1.6 -0.3 Q-2.1 0.6 -1.1 1.1 Q-1 1.9 0 1.7 Q1 1.9 1.1 1.1 Q2.1 0.6 1.6 -0.3 Q1.8 -1.7 0.2 -1.6 Q0 -1.9 -0.2 -1.6Z"
      fill="#F9A8D4"
      stroke="#EC4899"
      strokeWidth="0.2"
    />
    <path
      d="M0 -1.7 V1.7 M-0.9 -0.8 Q0 -0.4 0.9 -0.8 M-0.9 0.5 Q0 0.1 0.9 0.5"
      fill="none"
      stroke="#EC4899"
      strokeWidth="0.18"
    />
  </g>
);

/** Die that wobbles. Local origin: cube center. */
const Dice = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-swing">
      <rect
        fill="#FAFAF9"
        height="2.8"
        rx="0.4"
        stroke="#A8A29E"
        strokeWidth="0.2"
        width="2.8"
        x="-1.4"
        y="-1.4"
      />
      <circle cx="-0.6" cy="-0.6" fill="#1C1917" r="0.28" />
      <circle cx="0.6" cy="0.6" fill="#1C1917" r="0.28" />
      <circle cx="0" cy="0" fill="#1C1917" r="0.28" />
      <circle cx="0.6" cy="-0.6" fill="#1C1917" r="0.28" />
      <circle cx="-0.6" cy="0.6" fill="#1C1917" r="0.28" />
    </g>
  </g>
);

/** Two-prong plug. Local origin: body center. */
const Plug = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect fill="#F59E0B" height="2" rx="0.3" width="2.2" x="-1.1" y="-0.4" />
    <line
      stroke="#F59E0B"
      strokeLinecap="round"
      strokeWidth="0.35"
      x1="-0.5"
      x2="-0.5"
      y1="-0.4"
      y2="-1.5"
    />
    <line
      stroke="#F59E0B"
      strokeLinecap="round"
      strokeWidth="0.35"
      x1="0.5"
      x2="0.5"
      y1="-0.4"
      y2="-1.5"
    />
    <path d="M-0.6 1.6 Q0 2.4 0.9 2" fill="none" stroke="#78716C" strokeWidth="0.3" />
  </g>
);

/** Lightning bolt that flashes. Local origin: bolt center. */
const Bolt = ({ x, y, cls = 'claude-octopus__x-bolt' }: XY & { readonly cls?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      className={cls}
      d="M0.4 -1.9 L-1 0.2 H0 L-0.4 1.9 L1.2 -0.4 H0.1 L0.7 -1.9Z"
      fill="#FBBF24"
      stroke="#F59E0B"
      strokeWidth="0.15"
    />
  </g>
);

/** Wrapped gift. Local origin: box center. */
const Gift = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect fill="#F472B6" height="2" rx="0.15" width="3" x="-1.5" y="-0.4" />
    <rect fill="#EC4899" height="0.7" width="3" x="-1.5" y="-0.4" />
    <rect fill="#FBBF24" height="2.4" width="0.5" x="-0.25" y="-0.4" />
    <path d="M-0.25 -0.6 Q-1.2 -1.6 -0.25 -1.1 Q0.7 -1.6 0.25 -0.6" fill="#FBBF24" />
  </g>
);

/** Syringe. Local origin: barrel center. */
const Syringe = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y}) rotate(45)`}>
    <rect
      fill="#E0F2FE"
      height="1"
      rx="0.1"
      stroke="#0EA5E9"
      strokeWidth="0.2"
      width="2.6"
      x="-1.3"
      y="-0.5"
    />
    <rect fill="#F87171" height="0.7" width="1" x="-1.2" y="-0.35" />
    <line
      stroke="#94A3B8"
      strokeLinecap="round"
      strokeWidth="0.3"
      x1="1.3"
      x2="2.4"
      y1="0"
      y2="0"
    />
    <line stroke="#0EA5E9" strokeWidth="0.3" x1="-1.3" x2="-1.9" y1="0" y2="0" />
  </g>
);

/** Download tray + arrow. Local origin: arrow center. */
const Download = ({ x, y, color = '#22C55E' }: XY & { readonly color?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <line
      stroke={color}
      strokeLinecap="round"
      strokeWidth="0.45"
      x1="0"
      x2="0"
      y1="-1.7"
      y2="0.6"
    />
    <path
      d="M-0.8 -0.2 L0 0.9 L0.8 -0.2"
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="0.45"
    />
    <path d="M-1.4 1.4 H1.4" stroke={color} strokeLinecap="round" strokeWidth="0.45" />
  </g>
);

/** Wall calendar. Local origin: sheet center. */
const Calendar = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      fill="#FAFAF9"
      height="3.4"
      rx="0.3"
      stroke="#A8A29E"
      strokeWidth="0.2"
      width="3.8"
      x="-1.9"
      y="-1.5"
    />
    <rect fill="#EF4444" height="0.9" rx="0.3" width="3.8" x="-1.9" y="-1.5" />
    <line stroke="#fff" strokeWidth="0.25" x1="-1" x2="-1" y1="-1.9" y2="-1.1" />
    <line stroke="#fff" strokeWidth="0.25" x1="1" x2="1" y1="-1.9" y2="-1.1" />
    <rect fill="#60A5FA" height="0.7" width="0.7" x="-1.4" y="0" />
    <rect fill="#D6D3D1" height="0.7" width="0.7" x="-0.35" y="0" />
    <rect fill="#D6D3D1" height="0.7" width="0.7" x="0.7" y="0" />
  </g>
);

/** Clock with sweeping hands. Local origin: face center. */
const Clock = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="0" cy="0" fill="#FAFAF9" r="1.6" stroke="#57534E" strokeWidth="0.3" />
    <g className="claude-octopus__x-gear">
      <line
        stroke="#1C1917"
        strokeLinecap="round"
        strokeWidth="0.3"
        x1="0"
        x2="0"
        y1="0"
        y2="-1.1"
      />
      <line
        stroke="#1C1917"
        strokeLinecap="round"
        strokeWidth="0.25"
        x1="0"
        x2="0.7"
        y1="0"
        y2="0.4"
      />
    </g>
    <circle cx="0" cy="0" fill="#1C1917" r="0.2" />
  </g>
);

/** Cyclic arrows that rotate. Local origin: loop center. */
const Recycle = ({ x, y, color = '#22C55E' }: XY & { readonly color?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-gear">
      <path
        d="M-1.4 -0.4 A1.5 1.5 0 0 1 1.2 -0.9"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="0.4"
      />
      <path
        d="M1.4 0.4 A1.5 1.5 0 0 1 -1.2 0.9"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="0.4"
      />
      <path d="M1.2 -1.5 L1.5 -0.7 L0.6 -0.8Z" fill={color} />
      <path d="M-1.2 1.5 L-1.5 0.7 L-0.6 0.8Z" fill={color} />
    </g>
  </g>
);

/** Spinning globe. Local origin: globe center. */
const Globe = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="0" cy="0" fill="#3B82F6" r="1.6" />
    <g className="claude-octopus__x-gear" fill="none" stroke="#DBEAFE" strokeWidth="0.22">
      <ellipse cx="0" cy="0" rx="0.7" ry="1.6" />
      <line x1="-1.6" x2="1.6" y1="0" y2="0" />
      <path d="M-1.5 -0.7 H1.5 M-1.5 0.7 H1.5" />
    </g>
    <path d="M-0.6 -0.8 Q0.2 -0.4 -0.2 0.2 Q0.5 0.6 0 1.1" fill="#4ADE80" opacity="0.9" />
  </g>
);

/** Ascending signal bars. Local origin: baseline mid. */
const Signal = ({ x, y, color = '#22C55E' }: XY & { readonly color?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      className="claude-octopus__x-bar claude-octopus__x-bar--1"
      fill={color}
      height="1"
      rx="0.1"
      width="0.7"
      x="-1.8"
      y="0.4"
    />
    <rect
      className="claude-octopus__x-bar claude-octopus__x-bar--2"
      fill={color}
      height="1.7"
      rx="0.1"
      width="0.7"
      x="-0.7"
      y="-0.3"
    />
    <rect
      className="claude-octopus__x-bar claude-octopus__x-bar--3"
      fill={color}
      height="2.4"
      rx="0.1"
      width="0.7"
      x="0.4"
      y="-1"
    />
    <rect fill={color} height="3.1" opacity="0.5" rx="0.1" width="0.7" x="1.5" y="-1.7" />
  </g>
);

/** Snail. Local origin: shell center. */
const Snail = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-2 1 Q-2.2 0.4 -1.4 0.4 H0"
      fill="none"
      stroke="#A16207"
      strokeLinecap="round"
      strokeWidth="0.35"
    />
    <circle cx="0.3" cy="0.1" fill="#FBBF24" r="1.3" stroke="#A16207" strokeWidth="0.25" />
    <path d="M0.3 0.1 A0.8 0.8 0 1 0 1 0.4" fill="none" stroke="#A16207" strokeWidth="0.25" />
    <line
      stroke="#A16207"
      strokeLinecap="round"
      strokeWidth="0.28"
      x1="-1.4"
      x2="-1.9"
      y1="0.5"
      y2="-0.4"
    />
    <line
      stroke="#A16207"
      strokeLinecap="round"
      strokeWidth="0.28"
      x1="-1.2"
      x2="-1.5"
      y1="0.5"
      y2="-0.5"
    />
  </g>
);

/** Wrench that swings. Local origin: head center. */
const Wrench = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y}) rotate(45)`}>
    <g className="claude-octopus__x-swing">
      <path
        d="M-0.4 1.9 L-0.4 -0.3 A1 1 0 1 1 0.4 -0.3 L0.4 1.9Z"
        fill="#94A3B8"
        stroke="#64748B"
        strokeWidth="0.2"
      />
      <circle cx="0" cy="-0.9" fill="#E2E8F0" r="0.45" />
    </g>
  </g>
);

/** Fish hook that swings. Local origin: eye. */
const Hook = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-swing">
      <path
        d="M0 -1.8 V0.4 A0.9 0.9 0 1 1 -0.9 0.4"
        fill="none"
        stroke="#78716C"
        strokeLinecap="round"
        strokeWidth="0.4"
      />
      <circle cx="0" cy="-1.8" fill="#78716C" r="0.28" />
    </g>
  </g>
);

/** Graduation cap. Local origin: board center. */
const GradCap = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 -1.4 L2.2 -0.4 L0 0.6 L-2.2 -0.4Z" fill="#1C1917" />
    <path d="M-1.3 -0.05 V1 Q0 1.8 1.3 1V-0.05" fill="#292524" />
    <line stroke="#FBBF24" strokeWidth="0.25" x1="2.2" x2="2.2" y1="-0.4" y2="1" />
    <circle cx="2.2" cy="1.1" fill="#FBBF24" r="0.3" />
  </g>
);

/** Striped road barrier. Local origin: bar center. */
const Barrier = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      fill="#F59E0B"
      height="1.1"
      rx="0.15"
      stroke="#B45309"
      strokeWidth="0.15"
      width="4"
      x="-2"
      y="-0.55"
    />
    <path
      d="M-1.6 0.5 L-0.9 -0.5 M-0.5 0.5 L0.2 -0.5 M0.6 0.5 L1.3 -0.5"
      stroke="#1C1917"
      strokeWidth="0.35"
    />
    <line stroke="#78716C" strokeWidth="0.35" x1="-1.5" x2="-1.5" y1="0.5" y2="2" />
    <line stroke="#78716C" strokeWidth="0.35" x1="1.5" x2="1.5" y1="0.5" y2="2" />
  </g>
);

/** Ice cube with a glint. Local origin: cube center. */
const IceCube = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      fill="#BAE6FD"
      height="2.6"
      rx="0.3"
      stroke="#7DD3FC"
      strokeWidth="0.2"
      width="2.6"
      x="-1.3"
      y="-1.3"
    />
    <path
      d="M-0.8 -0.9 L0.5 0.9 M0.4 -1 L-0.6 0.4"
      stroke="#E0F2FE"
      strokeLinecap="round"
      strokeWidth="0.3"
    />
    <Spark cls="claude-octopus__x-spark--1" s={0.45} x={0.8} y={-0.8} />
  </g>
);

/** Terminal window with a blinking cursor. Local origin: window center. */
const Terminal = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect fill="#1E293B" height="3.2" rx="0.3" width="4.2" x="-2.1" y="-1.6" />
    <rect fill="#334155" height="0.7" rx="0.3" width="4.2" x="-2.1" y="-1.6" />
    <circle cx="-1.6" cy="-1.25" fill="#EF4444" r="0.16" />
    <circle cx="-1.1" cy="-1.25" fill="#FBBF24" r="0.16" />
    <path
      d="M-1.6 0 L-0.9 0.5 L-1.6 1"
      fill="none"
      stroke="#22C55E"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="0.28"
    />
    <rect
      className="claude-octopus__x-siren"
      fill="#22C55E"
      height="0.6"
      width="0.9"
      x="-0.5"
      y="0.5"
    />
  </g>
);

/** Sunglasses (worn over the eyes). Local origin: bridge. */
const Sunglasses = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect fill="#1C1917" height="1" rx="0.3" width="1.4" x="-1.7" y="-0.5" />
    <rect fill="#1C1917" height="1" rx="0.3" width="1.4" x="0.3" y="-0.5" />
    <path d="M-0.3 -0.2 Q0 -0.5 0.3 -0.2" fill="none" stroke="#1C1917" strokeWidth="0.3" />
    <path
      d="M0.5 -0.3 L1.4 0"
      opacity="0.6"
      stroke="#fff"
      strokeLinecap="round"
      strokeWidth="0.2"
    />
  </g>
);

/** Coin that pops. Local origin: coin center. */
const Coin = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="claude-octopus__x-node">
      <circle cx="0" cy="0" fill="#FBBF24" r="1.5" stroke="#D97706" strokeWidth="0.25" />
      <text fill="#B45309" fontSize="2" fontWeight="700" textAnchor="middle" x="0" y="0.7">
        $
      </text>
    </g>
  </g>
);

/** Filing cabinet. Local origin: body center. */
const Cabinet = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      fill="#A8A29E"
      height="3.6"
      rx="0.2"
      stroke="#78716C"
      strokeWidth="0.2"
      width="3.2"
      x="-1.6"
      y="-1.8"
    />
    <rect fill="#D6D3D1" height="1.4" width="2.6" x="-1.3" y="-1.5" />
    <rect fill="#D6D3D1" height="1.4" width="2.6" x="-1.3" y="0.2" />
    <rect fill="#78716C" height="0.25" rx="0.1" width="0.9" x="-0.45" y="-0.9" />
    <rect fill="#78716C" height="0.25" rx="0.1" width="0.9" x="-0.45" y="0.8" />
  </g>
);

/** Megaphone with sound arcs. Local origin: cone center. */
const Megaphone = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-1.8 -0.7 L0.6 -1.5 V1.5 L-1.8 0.7Z"
      fill="#F59E0B"
      stroke="#B45309"
      strokeWidth="0.2"
    />
    <rect fill="#B45309" height="1.4" width="0.5" x="-2.1" y="-0.7" />
    <g
      className="claude-octopus__x-siren"
      fill="none"
      stroke="#FBBF24"
      strokeLinecap="round"
      strokeWidth="0.3"
    >
      <path d="M1.2 -0.8 Q1.9 0 1.2 0.8" />
      <path d="M1.9 -1.3 Q3 0 1.9 1.3" />
    </g>
  </g>
);

/** Briefcase. Local origin: body center. */
const Briefcase = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-1 -1 V-1.5 Q-1 -1.9 -0.5 -1.9 H0.5 Q1 -1.9 1 -1.5 V-1"
      fill="none"
      stroke="#78716C"
      strokeWidth="0.35"
    />
    <rect fill="#A16207" height="2.8" rx="0.3" width="4" x="-2" y="-1" />
    <rect fill="#854D0E" height="0.7" width="4" x="-2" y="0.1" />
    <rect fill="#FBBF24" height="0.5" width="0.8" x="-0.4" y="0.2" />
  </g>
);

/** Work boot. Local origin: ankle. */
const Boot = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-0.8 -1.8 V0.6 Q-0.8 1 -0.4 1 H1.6 Q2 1 1.8 0.5 L1 0 Q0.6 -0.3 0.6 -0.9 V-1.8Z"
      fill="#78350F"
      stroke="#451A03"
      strokeWidth="0.2"
    />
    <path d="M-0.8 0.2 H0.5" stroke="#451A03" strokeWidth="0.2" />
    <rect fill="#451A03" height="0.4" width="3" x="-1" y="1" />
  </g>
);

/** Folded roadmap with a route + pin. Local origin: sheet center. */
const Roadmap = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-2 -1.3 L-0.7 -1.6 L0.7 -1.3 L2 -1.6 V1.5 L0.7 1.8 L-0.7 1.5 L-2 1.8Z"
      fill="#FEF3C7"
      stroke="#D97706"
      strokeWidth="0.2"
    />
    <path d="M-0.7 -1.6 V1.5 M0.7 -1.3 V1.8" stroke="#D97706" strokeWidth="0.18" />
    <path
      d="M-1.6 0.6 Q0 -0.6 1.5 0.5"
      fill="none"
      stroke="#EF4444"
      strokeDasharray="0.4 0.3"
      strokeWidth="0.3"
    />
    <circle cx="1.5" cy="0.5" fill="#EF4444" r="0.3" />
  </g>
);

/** Scissors. Local origin: pivot. */
const Scissors = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="-0.9" cy="1.1" fill="none" r="0.6" stroke="#64748B" strokeWidth="0.3" />
    <circle cx="0.9" cy="1.1" fill="none" r="0.6" stroke="#64748B" strokeWidth="0.3" />
    <path
      d="M-0.5 0.7 L0.6 -1.7 M0.5 0.7 L-0.6 -1.7"
      fill="none"
      stroke="#94A3B8"
      strokeLinecap="round"
      strokeWidth="0.35"
    />
    <circle cx="0" cy="0.1" fill="#475569" r="0.2" />
  </g>
);

/** Factory with smokestacks. Local origin: base mid. */
const Factory = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <circle
      className="claude-octopus__x-bubble claude-octopus__x-bubble--1"
      cx="0.6"
      cy="-2"
      fill="#D6D3D1"
      r="0.3"
    />
    <circle
      className="claude-octopus__x-bubble claude-octopus__x-bubble--2"
      cx="-0.4"
      cy="-2"
      fill="#D6D3D1"
      r="0.25"
    />
    <path d="M-2 1.6 V-0.4 L0 0.6 V-0.4 L2 0.6 V-1.6 H2.6 V1.6Z" fill="#78716C" />
    <rect fill="#57534E" height="0.5" width="0.6" x="-1.2" y="-1.6" />
    <rect fill="#292524" height="0.7" width="0.6" x="-1.4" y="0.6" />
    <rect fill="#292524" height="0.7" width="0.6" x="0.2" y="0.6" />
  </g>
);

/** House. Local origin: wall center. */
const House = ({ x, y, accent = '#22C55E' }: XY & { readonly accent?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 -1.8 L2 -0.2 H-2Z" fill="#EF4444" />
    <rect
      fill="#FEF3C7"
      height="2.2"
      stroke="#D6D3D1"
      strokeWidth="0.15"
      width="3"
      x="-1.5"
      y="-0.2"
    />
    <rect fill={accent} height="1.1" width="0.9" x="-0.45" y="0.9" />
    <rect fill="#93C5FD" height="0.7" width="0.7" x="0.5" y="0.2" />
  </g>
);

/** Abacus. Local origin: frame center. */
const Abacus = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      fill="none"
      height="3"
      rx="0.3"
      stroke="#78716C"
      strokeWidth="0.3"
      width="3.6"
      x="-1.8"
      y="-1.5"
    />
    <line stroke="#A8A29E" strokeWidth="0.15" x1="-1.8" x2="1.8" y1="-0.5" y2="-0.5" />
    <line stroke="#A8A29E" strokeWidth="0.15" x1="-1.8" x2="1.8" y1="0.5" y2="0.5" />
    <circle cx="-1.1" cy="-0.5" fill="#EF4444" r="0.3" />
    <circle cx="-0.4" cy="-0.5" fill="#EF4444" r="0.3" />
    <circle cx="1.2" cy="0.5" fill="#3B82F6" r="0.3" />
    <circle cx="0.5" cy="0.5" fill="#3B82F6" r="0.3" />
  </g>
);

/** Checkered flag on a pole that waves. Local origin: pole base. */
const CheckerFlag = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <line
      stroke="#57534E"
      strokeLinecap="round"
      strokeWidth="0.35"
      x1="0"
      x2="0"
      y1="0.4"
      y2="-3.6"
    />
    <g className="claude-octopus__x-flag">
      <rect fill="#fff" height="2" width="2.6" x="0" y="-3.4" />
      <rect fill="#1C1917" height="0.66" width="0.86" x="0" y="-3.4" />
      <rect fill="#1C1917" height="0.66" width="0.86" x="1.72" y="-3.4" />
      <rect fill="#1C1917" height="0.66" width="0.86" x="0.86" y="-2.74" />
      <rect fill="#1C1917" height="0.66" width="0.86" x="0" y="-2.08" />
      <rect fill="#1C1917" height="0.66" width="0.86" x="1.72" y="-2.08" />
    </g>
  </g>
);

/** Monster face with blinking eyes. Local origin: head center. */
const Monster = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-1.7 1.3 V-0.6 A1.7 1.7 0 0 1 1.7 -0.6 V1.3 L1.1 0.8 L0.55 1.3 L0 0.8 L-0.55 1.3 L-1.1 0.8Z"
      fill="#7C3AED"
      stroke="#5B21B6"
      strokeWidth="0.2"
    />
    <circle cx="-0.6" cy="-0.3" fill="#fff" r="0.5" />
    <circle cx="0.6" cy="-0.3" fill="#fff" r="0.5" />
    <circle className="claude-octopus__x-siren" cx="-0.6" cy="-0.3" fill="#1C1917" r="0.25" />
    <circle className="claude-octopus__x-siren" cx="0.6" cy="-0.3" fill="#1C1917" r="0.25" />
    <path
      d="M-0.7 0.4 L-0.4 0.1 L0 0.4 L0.4 0.1 L0.7 0.4"
      fill="none"
      stroke="#fff"
      strokeWidth="0.2"
    />
  </g>
);

/** Race car. Local origin: chassis center. */
const RaceCar = ({ x, y, fill = '#EF4444' }: XY & { readonly fill?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-2 0.6 Q-2 -0.1 -1.2 -0.2 L-0.6 -0.9 Q0 -1.1 0.8 -0.9 L1.4 -0.2 Q2 -0.1 2 0.6Z"
      fill={fill}
      stroke="#B91C1C"
      strokeWidth="0.2"
    />
    <circle cx="-1.1" cy="0.7" fill="#1C1917" r="0.55" />
    <circle cx="1.1" cy="0.7" fill="#1C1917" r="0.55" />
    <path d="M-0.4 -0.7 H0.7 L0.4 -0.2 H-0.2Z" fill="#93C5FD" />
  </g>
);

/** Stack of books. Local origin: stack center. */
const BookStack = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect fill="#EF4444" height="0.8" rx="0.1" width="3.6" x="-1.8" y="0.7" />
    <rect fill="#3B82F6" height="0.8" rx="0.1" width="3.2" x="-1.4" y="-0.1" />
    <rect fill="#22C55E" height="0.8" rx="0.1" width="3.4" x="-1.6" y="-0.9" />
    <rect fill="#FBBF24" height="1.5" rx="0.1" width="1.1" x="0.9" y="-2.4" />
  </g>
);

/** Floppy disk. Local origin: body center. */
const Disk = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M-1.6 -1.6 H1.1 L1.6 -1.1 V1.6 H-1.6Z"
      fill="#3B82F6"
      stroke="#1D4ED8"
      strokeWidth="0.2"
    />
    <rect fill="#DBEAFE" height="1" width="1.8" x="-0.9" y="-1.6" />
    <rect fill="#1E3A8A" height="0.6" width="0.5" x="0.1" y="-1.5" />
    <rect fill="#DBEAFE" height="1.1" rx="0.1" width="2" x="-1" y="0.1" />
  </g>
);

/** Adhesive bandage. Local origin: center. */
const Bandaid = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y}) rotate(-35)`}>
    <rect
      fill="#FBBF24"
      height="1.4"
      rx="0.7"
      stroke="#D97706"
      strokeWidth="0.15"
      width="3.6"
      x="-1.8"
      y="-0.7"
    />
    <rect fill="#FDE68A" height="1.2" width="1.4" x="-0.7" y="-0.6" />
    <circle cx="-0.3" cy="-0.2" fill="#D97706" r="0.12" />
    <circle cx="0.3" cy="0.2" fill="#D97706" r="0.12" />
    <circle cx="0.3" cy="-0.2" fill="#D97706" r="0.12" />
    <circle cx="-0.3" cy="0.2" fill="#D97706" r="0.12" />
  </g>
);

/** Soap bar with rising bubbles. Local origin: bar center. */
const Soap = ({ x, y }: XY) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      fill="#A7F3D0"
      height="1.8"
      rx="0.4"
      stroke="#34D399"
      strokeWidth="0.2"
      width="3"
      x="-1.5"
      y="0"
    />
    <path d="M-0.9 0 Q-0.9 -0.9 0 -0.9 Q0.9 -0.9 0.9 0" fill="#6EE7B7" />
    <circle
      className="claude-octopus__x-bubble claude-octopus__x-bubble--1"
      cx="-0.3"
      cy="-1"
      fill="#D1FAE5"
      r="0.3"
    />
    <circle
      className="claude-octopus__x-bubble claude-octopus__x-bubble--2"
      cx="0.5"
      cy="-0.8"
      fill="#D1FAE5"
      r="0.25"
    />
  </g>
);

// ————————————————————————————————————————————————————————————————
// Overlay recipes — one per extended pose id
// ————————————————————————————————————————————————————————————————

const OVERLAYS: Record<string, () => ReactNode> = {
  brainstorming: () => (
    <g className="claude-octopus__x">
      <Bulb x={18.8} y={5} />
      <Spark cls="claude-octopus__x-spark--2" s={0.5} x={21.4} y={7.4} />
      <Mouth mood="smile" />
    </g>
  ),
  refactoring: () => (
    <g className="claude-octopus__x">
      <Gear x={19.2} y={6} />
      <Gear x={21.4} y={8} />
    </g>
  ),
  optimizing: () => (
    <g className="claude-octopus__x">
      <path
        className="claude-octopus__x-bolt"
        d="M19.8 3.6 L18.4 6.4 H19.7 L18.9 8.8 L21.4 5.6 H20 L20.9 3.6 Z"
        fill="#FBBF24"
        stroke="#F59E0B"
        strokeWidth="0.2"
      />
      <Flame cls="claude-octopus__x-flame--1" x={21.2} y={9.2} />
    </g>
  ),
  benchmarking: () => (
    <g className="claude-octopus__x">
      <Bars x={18} y={8.4} />
    </g>
  ),
  profiling: () => (
    <g className="claude-octopus__x">
      <Magnifier x={19} y={6.4} />
      <Bars x={2.4} y={9} />
    </g>
  ),
  logging: () => (
    <g className="claude-octopus__x">
      <Doc accent="#6A9955" x={18.4} y={4.4} />
    </g>
  ),
  monitoring: () => (
    <g className="claude-octopus__x">
      <Radar x={19.6} y={6} />
    </g>
  ),
  alerting: () => (
    <g className="claude-octopus__x">
      <Siren x={19.4} y={5.4} />
      <Mouth mood="open" />
    </g>
  ),
  testing: () => (
    <g className="claude-octopus__x">
      <Beaker x={19.4} y={5} />
    </g>
  ),
  linting: () => (
    <g className="claude-octopus__x">
      <Spark cls="claude-octopus__x-spark--1" s={0.9} x={18.4} y={5} />
      <Spark cls="claude-octopus__x-spark--2" s={0.6} x={20.6} y={4} />
      <Spark cls="claude-octopus__x-spark--3" s={0.7} x={21.2} y={6.6} />
    </g>
  ),
  starring: () => (
    <g className="claude-octopus__x">
      <Star x={19.6} y={5.6} />
      <Mouth mood="smile" />
    </g>
  ),
  analytics: () => (
    <g className="claude-octopus__x">
      <Bars x={17.8} y={8.4} />
      <path
        className="claude-octopus__x-trend"
        d="M18 7.4 L19.6 5.9 L20.6 6.6 L22.2 4.6"
        fill="none"
        stroke="#16A34A"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.35"
      />
    </g>
  ),
  rebasing: () => (
    <g className="claude-octopus__x">
      <GitNode color="#F59E0B" x={19.8} y={5.4} />
    </g>
  ),
  stashing: () => (
    <g className="claude-octopus__x">
      <Box x={18.4} y={5} />
    </g>
  ),
  whiteboarding: () => (
    <g className="claude-octopus__x">
      <g transform="translate(1.8 3.4)">
        <rect
          fill="#FAFAF9"
          height="4.2"
          rx="0.3"
          stroke="#A8A29E"
          strokeWidth="0.25"
          width="5.4"
          x="0"
          y="0"
        />
        <rect fill="#3B82F6" height="1.3" rx="0.15" width="1.7" x="0.6" y="0.7" />
        <line
          stroke="#22C55E"
          strokeLinecap="round"
          strokeWidth="0.3"
          x1="2.7"
          x2="4.6"
          y1="1.3"
          y2="1.3"
        />
        <line stroke="#A8A29E" strokeWidth="0.25" x1="0.6" x2="4.6" y1="2.9" y2="2.9" />
        <line stroke="#A8A29E" strokeWidth="0.25" x1="0.6" x2="3.1" y1="3.5" y2="3.5" />
      </g>
    </g>
  ),
  pairing: () => (
    <g className="claude-octopus__x">
      <Person fill="#8B5CF6" x={18.6} y={5.4} />
      <Person fill="#22C55E" x={21.2} y={5.4} />
    </g>
  ),
  mobbing: () => (
    <g className="claude-octopus__x">
      <Person fill="#8B5CF6" x={17.9} y={5.6} />
      <Person fill="#F59E0B" x={20} y={5.2} />
      <Person fill="#22C55E" x={22} y={5.7} />
    </g>
  ),
  standup: () => (
    <g className="claude-octopus__x">
      <Person fill="#60A5FA" x={18} y={6} />
      <Person fill="#F472B6" x={20} y={6} />
      <Person fill="#34D399" x={22} y={6} />
    </g>
  ),
  documenting: () => (
    <g className="claude-octopus__x">
      <Doc accent="#A8A29E" x={17.4} y={5.2} />
      <Doc accent="#60A5FA" x={18.8} y={4.2} />
    </g>
  ),
  postmortem: () => (
    <g className="claude-octopus__x">
      <Doc accent="#EF4444" x={17.4} y={4.6} />
      <Magnifier x={21.2} y={8} />
    </g>
  ),
  readme: () => (
    <g className="claude-octopus__x">
      <Book x={19.8} y={5} />
    </g>
  ),
  changelog: () => (
    <g className="claude-octopus__x">
      <Scroll x={18.8} y={4} />
    </g>
  ),
  versioning: () => (
    <g className="claude-octopus__x">
      <Tag fill="#8B5CF6" x={19.9} y={5.2} />
    </g>
  ),
  tagging: () => (
    <g className="claude-octopus__x">
      <Tag fill="#F59E0B" x={19.9} y={5.2} />
    </g>
  ),
  cherrypicking: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.6 5.6)">
        <path d="M-0.1 -2 Q1.3 -2.6 1.7 -1.2" fill="none" stroke="#15803D" strokeWidth="0.3" />
        <path d="M-0.1 -2 Q-1 -1 -1.2 0.1" fill="none" stroke="#15803D" strokeWidth="0.3" />
        <circle cx="-1.3" cy="0.9" fill="#DC2626" r="0.9" />
        <circle cx="1" cy="0.5" fill="#EF4444" r="0.8" />
      </g>
    </g>
  ),
  cloning: () => (
    <g className="claude-octopus__x">
      <Box fill="#94A3B8" x={17.2} y={5.6} />
      <Box fill="#C19A6B" x={18.8} y={4.6} />
    </g>
  ),
  forking: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.7 5.2)">
        <path
          d="M0 2 V0.4 Q0 -0.7 -1.4 -0.7 M0 0.4 Q0 -0.7 1.4 -0.7"
          fill="none"
          stroke={INK}
          strokeWidth="0.35"
        />
        <circle cx="0" cy="2" fill="#22C55E" r="0.55" />
        <circle cx="-1.4" cy="-0.9" fill="#8B5CF6" r="0.5" />
        <circle cx="1.4" cy="-0.9" fill="#60A5FA" r="0.5" />
      </g>
    </g>
  ),
  darkmode: () => (
    <g className="claude-octopus__x">
      <Moon x={19.4} y={5.4} />
      <Spark cls="claude-octopus__x-spark--2" s={0.5} x={21.8} y={7.2} />
    </g>
  ),
  slacking: () => (
    <g className="claude-octopus__x">
      <ChatBubble x={17.6} y={4.2} />
    </g>
  ),
  retro: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 6)">
        <ellipse cx="0" cy="1.7" fill="#78716C" rx="1.1" ry="0.4" />
        <circle
          cx="0"
          cy="0"
          fill="rgba(139,92,246,0.45)"
          r="1.5"
          stroke="#8B5CF6"
          strokeWidth="0.3"
        />
        <Spark cls="claude-octopus__x-spark--1" s={0.5} x={0.3} y={-0.2} />
      </g>
    </g>
  ),
  oncall: () => (
    <g className="claude-octopus__x">
      <g className="claude-octopus__x-siren" transform="translate(19.8 5.6)">
        <rect fill="#44403C" height="3" rx="0.5" width="1.8" x="-0.9" y="-1.5" />
        <rect fill="#93C5FD" height="1.7" rx="0.15" width="1.2" x="-0.6" y="-1.1" />
        <line
          stroke="#22C55E"
          strokeLinecap="round"
          strokeWidth="0.3"
          x1="-2.4"
          x2="-1.8"
          y1="-1.6"
          y2="-1.9"
        />
        <line
          stroke="#22C55E"
          strokeLinecap="round"
          strokeWidth="0.3"
          x1="1"
          x2="1.6"
          y1="-1.6"
          y2="-1.9"
        />
      </g>
    </g>
  ),
  paging: () => (
    <g className="claude-octopus__x">
      <g className="claude-octopus__x-siren" transform="translate(19.6 5.6)">
        <rect fill="#57534E" height="2.4" rx="0.3" width="3" x="-1.5" y="-1.2" />
        <rect fill="#A7F3D0" height="1" rx="0.1" width="2.2" x="-1.1" y="-0.9" />
        <rect fill="#292524" height="0.5" width="2.2" x="-1.1" y="0.4" />
      </g>
    </g>
  ),
  incident: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 5.6)">
        <circle cx="0" cy="0" fill="#fff" r="1.6" stroke="#DC2626" strokeWidth="0.3" />
        <rect
          className="claude-octopus__x-siren"
          fill="#DC2626"
          height="2"
          rx="0.15"
          width="0.7"
          x="-0.35"
          y="-1"
        />
        <rect
          className="claude-octopus__x-siren"
          fill="#DC2626"
          height="0.7"
          rx="0.15"
          width="2"
          x="-1"
          y="-0.35"
        />
      </g>
    </g>
  ),
  formatting: () => (
    <g className="claude-octopus__x">
      <g transform="translate(18 4.6)">
        <rect
          fill="#FAFAF9"
          height="4"
          rx="0.3"
          stroke="#A8A29E"
          strokeWidth="0.2"
          width="3.6"
          x="0"
          y="0"
        />
        <rect fill="#A8A29E" height="0.4" rx="0.1" width="1.4" x="0.5" y="0.8" />
        <rect fill="#A8A29E" height="0.4" rx="0.1" width="2.4" x="0.5" y="1.6" />
        <rect
          className="claude-octopus__x-writeline"
          fill="#60A5FA"
          height="0.4"
          rx="0.1"
          width="2"
          x="0.5"
          y="2.4"
        />
        <rect fill="#A8A29E" height="0.4" rx="0.1" width="1.8" x="0.5" y="3.2" />
      </g>
    </g>
  ),
  fuzzing: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 5.8)">
        <g className="claude-octopus__x-gear">
          <rect
            fill="#FAFAF9"
            height="2.6"
            rx="0.4"
            stroke="#78716C"
            strokeWidth="0.2"
            width="2.6"
            x="-1.3"
            y="-1.3"
          />
          <circle cx="-0.5" cy="-0.5" fill="#292524" r="0.28" />
          <circle cx="0.5" cy="0.5" fill="#292524" r="0.28" />
          <circle cx="0.5" cy="-0.5" fill="#292524" r="0.28" />
          <circle cx="-0.5" cy="0.5" fill="#292524" r="0.28" />
          <circle cx="0" cy="0" fill="#292524" r="0.28" />
        </g>
      </g>
    </g>
  ),
  mocking: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.6 5.8)">
        <path d="M-1.4 -1.4 H1.4 Q1.4 1.6 0 1.8 Q-1.4 1.6 -1.4 -1.4Z" fill="#A855F7" />
        <path
          d="M-0.9 -0.6 h0.7 M0.2 -0.6 h0.7"
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeWidth="0.3"
        />
        <path
          d="M-0.6 0.6 Q0 1 0.6 0.6"
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeWidth="0.3"
        />
      </g>
    </g>
  ),
  seeding: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 8)">
        <ellipse cx="0" cy="1.9" fill="#8C6239" rx="1.3" ry="0.4" />
        <path
          d="M0 1.9 V-0.4"
          fill="none"
          stroke="#15803D"
          strokeLinecap="round"
          strokeWidth="0.4"
        />
        <path d="M0 0.2 Q-1.4 0 -1.4 -1.2 Q-0.1 -1 0 0.2Z" fill="#22C55E" />
        <path d="M0 -0.2 Q1.4 -0.4 1.4 -1.6 Q0.1 -1.4 0 -0.2Z" fill="#4ADE80" />
      </g>
    </g>
  ),
  migrating: () => (
    <g className="claude-octopus__x">
      <Box fill="#C19A6B" x={16.6} y={5.4} />
      <Chevron color="#22C55E" dir="right" x={21} y={6.9} />
    </g>
  ),
  rollback: () => (
    <g className="claude-octopus__x">
      <Chevron color="#DC2626" dir="left" x={20.2} y={5.8} />
      <Chevron color="#DC2626" dir="left" x={21.6} y={5.8} />
    </g>
  ),
  canarying: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.4 6)">
        <ellipse cx="0" cy="0.4" fill="#FACC15" rx="1.4" ry="1.1" />
        <circle cx="1" cy="-0.8" fill="#FACC15" r="0.85" />
        <path d="M1.7 -0.8 L2.5 -0.6 L1.7 -0.4Z" fill="#F97316" />
        <circle cx="1.2" cy="-1" fill="#292524" r="0.16" />
      </g>
    </g>
  ),
  bluegreen: () => (
    <g className="claude-octopus__x">
      <circle cx="18.8" cy="5.6" fill="#3B82F6" r="1.4" />
      <circle cx="21" cy="5.6" fill="#22C55E" r="1.4" />
    </g>
  ),
  flagging: () => (
    <g className="claude-octopus__x">
      <Flag fill="#EF4444" x={19.8} y={8} />
    </g>
  ),
  abtesting: () => (
    <g className="claude-octopus__x">
      <g transform="translate(18 4.8)">
        <rect fill="#DBEAFE" height="3.4" rx="0.3" width="1.8" x="0" y="0" />
        <rect fill="#DCFCE7" height="3.4" rx="0.3" width="1.8" x="2" y="0" />
        <text fill="#2563EB" fontSize="1.7" fontWeight="700" x="0.5" y="2.4">
          A
        </text>
        <text fill="#16A34A" fontSize="1.7" fontWeight="700" x="2.5" y="2.4">
          B
        </text>
      </g>
    </g>
  ),
  funneling: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.6 5)">
        <path
          d="M-1.6 -1 H1.6 L0.5 0.6 V2 H-0.5 V0.6Z"
          fill="#93C5FD"
          stroke="#3B82F6"
          strokeWidth="0.2"
        />
        <circle
          className="claude-octopus__x-bubble claude-octopus__x-bubble--1"
          cx="0"
          cy="2.6"
          fill="#3B82F6"
          r="0.3"
        />
      </g>
    </g>
  ),
  churning: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 5.8)">
        <g className="claude-octopus__x-gear">
          <path
            d="M0 -1.6 A1.6 1.6 0 1 1 -1.4 -0.8"
            fill="none"
            stroke="#EF4444"
            strokeLinecap="round"
            strokeWidth="0.4"
          />
          <path d="M-1.4 -0.8 L-1.9 -1.1 L-1.2 -1.5Z" fill="#EF4444" />
        </g>
      </g>
      <Mouth mood="frown" />
    </g>
  ),
  onboarding: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.2 5.4)">
        <rect fill="#C7D2FE" height="3.6" rx="0.2" width="2.2" x="0.6" y="-1.8" />
        <rect fill="#818CF8" height="3.6" width="0.5" x="0.6" y="-1.8" />
      </g>
      <Chevron color="#22C55E" dir="right" x={17.6} y={5.4} />
    </g>
  ),
  offboarding: () => (
    <g className="claude-octopus__x">
      <g transform="translate(18.2 5.4)">
        <rect fill="#E7E5E4" height="3.6" rx="0.2" width="2.2" x="0" y="-1.8" />
        <rect fill="#A8A29E" height="3.6" width="0.5" x="1.7" y="-1.8" />
      </g>
      <Chevron color="#78716C" dir="right" x={21.2} y={5.4} />
    </g>
  ),
  retiring: () => (
    <g className="claude-octopus__x">
      <g className="claude-octopus__x-rays" transform="translate(19.8 6)">
        <circle cx="0" cy="0" fill="#FBBF24" r="1.3" />
        <g stroke="#FBBF24" strokeLinecap="round" strokeWidth="0.3">
          <line x1="0" x2="0" y1="-2.4" y2="-1.8" />
          <line x1="-2.4" x2="-1.8" y1="0" y2="0" />
          <line x1="2.4" x2="1.8" y1="0" y2="0" />
          <line x1="-1.7" x2="-1.3" y1="-1.7" y2="-1.3" />
          <line x1="1.7" x2="1.3" y1="-1.7" y2="-1.3" />
        </g>
      </g>
    </g>
  ),
  interviewing: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 5.6)">
        <rect fill="#57534E" height="2" rx="0.55" width="1.1" x="-0.55" y="-1.6" />
        <ellipse cx="0" cy="-1.6" fill="#78716C" rx="0.7" ry="0.5" />
        <line stroke="#44403C" strokeWidth="0.35" x1="0" x2="0" y1="0.4" y2="1.4" />
        <path d="M-0.7 0.2 Q0 1 0.7 0.2" fill="none" stroke="#44403C" strokeWidth="0.3" />
      </g>
    </g>
  ),
  hiring: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 5.6)">
        <g className="claude-octopus__x-node">
          <circle cx="0" cy="0" fill="#22C55E" r="1.5" />
          <path
            d="M0 -0.8 V0.8 M-0.8 0 H0.8"
            stroke="#fff"
            strokeLinecap="round"
            strokeWidth="0.4"
          />
        </g>
      </g>
    </g>
  ),
  sketching: () => (
    <g className="claude-octopus__x">
      <rect
        fill="#FAFAF9"
        height="3"
        rx="0.2"
        stroke="#A8A29E"
        strokeWidth="0.2"
        width="3"
        x="17.6"
        y="7.4"
      />
      <Pencil x={20.4} y={5.6} />
    </g>
  ),
  wireframing: () => (
    <g className="claude-octopus__x">
      <g transform="translate(17.8 4.8)">
        <rect
          fill="#FAFAF9"
          height="4.2"
          rx="0.3"
          stroke="#A8A29E"
          strokeWidth="0.25"
          width="4.4"
          x="0"
          y="0"
        />
        <rect fill="#E7E5E4" height="0.9" width="3.6" x="0.4" y="0.5" />
        <rect fill="#E7E5E4" height="1.4" width="1.6" x="0.4" y="1.7" />
        <rect fill="#E7E5E4" height="1.4" width="1.6" x="2.4" y="1.7" />
      </g>
    </g>
  ),
  prototyping: () => (
    <g className="claude-octopus__x">
      <Box x={18.2} y={5} />
      <path d="M18.2 5 L21.6 8 M21.6 5 L18.2 8" opacity="0.8" stroke="#D1D5DB" strokeWidth="0.3" />
      <path d="M18 6.4 H21.8" stroke="#9CA3AF" strokeDasharray="0.3 0.2" strokeWidth="0.3" />
    </g>
  ),
  pitching: () => (
    <g className="claude-octopus__x">
      <Megaphone x={19.4} y={5.6} />
    </g>
  ),
  demoing: () => (
    <g className="claude-octopus__x">
      <g transform="translate(18 5)">
        <g className="claude-octopus__x-swing">
          <path d="M0 0.4 L4 -0.4 L4.2 0.4 L0.2 1.2Z" fill="#1C1917" />
          <path
            d="M0.3 0.5 L1 0 M1.4 0.3 L2.1 -0.2 M2.5 0.1 L3.2 -0.4"
            stroke="#fff"
            strokeWidth="0.3"
          />
        </g>
        <rect fill="#334155" height="2.4" rx="0.15" width="4" x="0.1" y="1.1" />
      </g>
    </g>
  ),
  fundraising: () => (
    <g className="claude-octopus__x">
      <Coin x={19.8} y={5.6} />
      <Coin x={17.6} y={7.4} />
    </g>
  ),
  bootstrapping: () => (
    <g className="claude-octopus__x">
      <Boot x={19.4} y={5.4} />
    </g>
  ),
  freelancing: () => (
    <g className="claude-octopus__x">
      <Briefcase x={19.6} y={5.8} />
    </g>
  ),
  mentoring: () => (
    <g className="claude-octopus__x">
      <GradCap x={19.8} y={4.8} />
      <Person fill="#8B5CF6" x={19.8} y={7.4} />
    </g>
  ),
  teaching: () => (
    <g className="claude-octopus__x">
      <g transform="translate(17.4 4.4)">
        <rect
          fill="#1F2937"
          height="3.4"
          rx="0.2"
          stroke="#78716C"
          strokeWidth="0.25"
          width="4.6"
          x="0"
          y="0"
        />
        <path
          d="M0.6 1 H3 M0.6 1.8 H2.2"
          stroke="#6EE7B7"
          strokeLinecap="round"
          strokeWidth="0.25"
        />
      </g>
      <Pencil x={21.4} y={8} />
    </g>
  ),
  learning: () => (
    <g className="claude-octopus__x">
      <Book x={19.8} y={5.6} />
      <Spark cls="claude-octopus__x-spark--1" s={0.6} x={19.8} y={3.8} />
    </g>
  ),
  certifying: () => (
    <g className="claude-octopus__x">
      <g transform="translate(17.8 4.6)">
        <rect
          fill="#FEFCE8"
          height="3.4"
          rx="0.2"
          stroke="#D97706"
          strokeWidth="0.2"
          width="4.4"
          x="0"
          y="0"
        />
        <line stroke="#D97706" strokeWidth="0.18" x1="0.6" x2="3.8" y1="0.9" y2="0.9" />
        <line stroke="#A8A29E" strokeWidth="0.15" x1="0.6" x2="3.2" y1="1.6" y2="1.6" />
        <line stroke="#A8A29E" strokeWidth="0.15" x1="0.6" x2="3.4" y1="2.2" y2="2.2" />
      </g>
      <circle cx="21.4" cy="8" fill="#EF4444" r="0.7" />
      <path d="M20.9 8.4 L20.6 9.4 L21.4 8.9 L22.2 9.4 L21.9 8.4" fill="#EF4444" />
    </g>
  ),
  securing: () => (
    <g className="claude-octopus__x">
      <Lock fill="#22C55E" x={19.8} y={5.8} />
    </g>
  ),
  auditing: () => (
    <g className="claude-octopus__x">
      <Doc accent="#22C55E" x={17.2} y={5} />
      <Magnifier x={21} y={7.6} />
    </g>
  ),
  patching: () => (
    <g className="claude-octopus__x">
      <Bandaid x={19.8} y={6} />
    </g>
  ),
  hardening: () => (
    <g className="claude-octopus__x">
      <Shield x={19.8} y={5.8} />
    </g>
  ),
  caching: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.6 6)">
        <path d="M-1.8 -0.9 L0 -1.7 L1.8 -0.9 L0 -0.1Z" fill="#60A5FA" />
        <path d="M-1.8 0 L0 -0.8 L1.8 0 L0 0.8Z" fill="#3B82F6" />
        <path d="M-1.8 0.9 L0 0.1 L1.8 0.9 L0 1.7Z" fill="#2563EB" />
      </g>
    </g>
  ),
  scaling: () => (
    <g className="claude-octopus__x">
      <Signal x={18.6} y={6.6} />
      <Chevron color="#22C55E" dir="up" x={21.6} y={5.4} />
    </g>
  ),
  sharding: () => (
    <g className="claude-octopus__x">
      <Puzzle fill="#8B5CF6" x={18.6} y={5.6} />
      <Puzzle fill="#60A5FA" x={21} y={6.4} />
    </g>
  ),
  balancing: () => (
    <g className="claude-octopus__x">
      <Scale x={19.8} y={5.8} />
    </g>
  ),
  throttling: () => (
    <g className="claude-octopus__x">
      <Snail x={19.6} y={6} />
    </g>
  ),
  queueing: () => (
    <g className="claude-octopus__x">
      <g transform="translate(17.4 6)">
        <rect fill="#93C5FD" height="1.4" rx="0.2" width="1.2" x="0" y="0" />
        <rect fill="#93C5FD" height="1.4" rx="0.2" width="1.2" x="1.5" y="0" />
        <rect fill="#93C5FD" height="1.4" rx="0.2" width="1.2" x="3" y="0" />
      </g>
      <Chevron color="#22C55E" dir="right" x={22} y={6.7} />
    </g>
  ),
  streaming: () => (
    <g className="claude-octopus__x">
      <g
        className="claude-octopus__x-siren"
        fill="none"
        stroke="#38BDF8"
        strokeLinecap="round"
        strokeWidth="0.35"
      >
        <path d="M17.6 5.4 Q18.6 4.8 19.6 5.4 Q20.6 6 21.6 5.4" />
        <path d="M17.6 6.8 Q18.6 6.2 19.6 6.8 Q20.6 7.4 21.6 6.8" />
        <path d="M17.6 8.2 Q18.6 7.6 19.6 8.2 Q20.6 8.8 21.6 8.2" />
      </g>
    </g>
  ),
  webhooks: () => (
    <g className="claude-octopus__x">
      <Hook x={19.8} y={5.6} />
      <Chevron color="#22C55E" dir="down" x={21.6} y={4.6} />
    </g>
  ),
  polling: () => (
    <g className="claude-octopus__x">
      <Recycle color="#3B82F6" x={19.8} y={5.8} />
    </g>
  ),
  subscribing: () => (
    <g className="claude-octopus__x">
      <Bell x={19.8} y={5.8} />
    </g>
  ),
  publishing: () => (
    <g className="claude-octopus__x">
      <Box fill="#C19A6B" x={18.2} y={6} />
      <Chevron color="#22C55E" dir="up" x={19.9} y={4.4} />
    </g>
  ),
  graphql: () => (
    <g className="claude-octopus__x">
      <g stroke="#E535AB" strokeWidth="0.25" transform="translate(19.8 6)">
        <line x1="0" x2="0" y1="0" y2="-1.6" />
        <line x1="0" x2="1.4" y1="0" y2="0.8" />
        <line x1="0" x2="-1.4" y1="0" y2="0.8" />
      </g>
      <circle cx="19.8" cy="6" fill="#E535AB" r="0.5" />
      <circle cx="19.8" cy="4.4" fill="#E535AB" r="0.45" />
      <circle cx="21.2" cy="6.8" fill="#E535AB" r="0.45" />
      <circle cx="18.4" cy="6.8" fill="#E535AB" r="0.45" />
    </g>
  ),
  grpcing: () => (
    <g className="claude-octopus__x">
      <Bolt x={20} y={5.8} />
      <g stroke="#38BDF8" strokeLinecap="round" strokeWidth="0.3">
        <line x1="21.4" x2="22.4" y1="5" y2="5" />
        <line x1="21.4" x2="22.6" y1="6" y2="6" />
      </g>
    </g>
  ),
  socketing: () => (
    <g className="claude-octopus__x">
      <Plug x={18.8} y={5.4} />
      <g transform="translate(21.6 6.4)">
        <rect
          fill="#E2E8F0"
          height="1.8"
          rx="0.3"
          stroke="#94A3B8"
          strokeWidth="0.2"
          width="1.5"
          x="-0.2"
          y="-0.9"
        />
        <circle cx="0.5" cy="-0.35" fill="#64748B" r="0.15" />
        <circle cx="0.5" cy="0.35" fill="#64748B" r="0.15" />
      </g>
    </g>
  ),
  cronning: () => (
    <g className="claude-octopus__x">
      <Clock x={19.8} y={5.8} />
    </g>
  ),
  scheduling: () => (
    <g className="claude-octopus__x">
      <Calendar x={19.6} y={5.8} />
    </g>
  ),
  backingup: () => (
    <g className="claude-octopus__x">
      <Disk x={18.8} y={5.6} />
      <Chevron color="#22C55E" dir="down" x={21.4} y={5.6} />
    </g>
  ),
  restoring: () => (
    <g className="claude-octopus__x">
      <Recycle color="#22C55E" x={19.8} y={5.8} />
    </g>
  ),
  archiving: () => (
    <g className="claude-octopus__x">
      <Cabinet x={19.8} y={5.8} />
    </g>
  ),
  parsing: () => (
    <g className="claude-octopus__x">
      <g
        fill="none"
        stroke="#A855F7"
        strokeLinecap="round"
        strokeWidth="0.4"
        transform="translate(19.8 6)"
      >
        <path d="M-1.3 -1.6 Q-2 -1.6 -2 -0.8 Q-2 0 -2.6 0 Q-2 0 -2 0.8 Q-2 1.6 -1.3 1.6" />
        <path d="M1.3 -1.6 Q2 -1.6 2 -0.8 Q2 0 2.6 0 Q2 0 2 0.8 Q2 1.6 1.3 1.6" />
      </g>
      <rect
        className="claude-octopus__x-siren"
        fill="#A855F7"
        height="1.6"
        width="0.4"
        x="19.6"
        y="5.2"
      />
    </g>
  ),
  validating: () => (
    <g className="claude-octopus__x">
      <Check x={19.8} y={5.8} />
      <Mouth mood="smile" />
    </g>
  ),
  sanitizing: () => (
    <g className="claude-octopus__x">
      <Soap x={19.6} y={5.4} />
    </g>
  ),
  opensourcing: () => (
    <g className="claude-octopus__x">
      <Globe x={19.8} y={5.8} />
      <Spark cls="claude-octopus__x-spark--2" s={0.5} x={21.8} y={4.4} />
    </g>
  ),
  contributing: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 6)">
        <path d="M0 1.6 V-0.2 Q0 -1.2 1.3 -1.2" fill="none" stroke={INK} strokeWidth="0.35" />
        <circle cx="0" cy="1.6" fill="#22C55E" r="0.5" />
        <circle cx="1.5" cy="-1.2" fill="#8B5CF6" r="0.5" />
      </g>
      <Chevron color="#22C55E" dir="up" x={18} y={5.4} />
    </g>
  ),
  triaging: () => (
    <g className="claude-octopus__x">
      <g transform="translate(17.8 5)">
        <rect fill="#EF4444" height="0.9" rx="0.2" width="2.4" x="0" y="0" />
        <rect fill="#F59E0B" height="0.9" rx="0.2" width="2.4" x="0.5" y="1.2" />
        <rect fill="#22C55E" height="0.9" rx="0.2" width="2.4" x="1" y="2.4" />
      </g>
    </g>
  ),
  prioritizing: () => (
    <g className="claude-octopus__x">
      <g transform="translate(18 5.2)">
        <rect
          className="claude-octopus__x-node"
          fill="#EF4444"
          height="0.8"
          rx="0.15"
          width="3.4"
          x="0"
          y="0"
        />
        <rect fill="#D6D3D1" height="0.7" rx="0.15" width="3.4" x="0" y="1.1" />
        <rect fill="#D6D3D1" height="0.7" rx="0.15" width="3.4" x="0" y="2.1" />
      </g>
    </g>
  ),
  estimating: () => (
    <g className="claude-octopus__x">
      <Abacus x={19.6} y={5.8} />
    </g>
  ),
  sprinting: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 5.8)">
        <circle cx="0.4" cy="-1.3" fill={INK} r="0.55" />
        <path
          d="M0.4 -0.8 L-0.2 0.4 L-0.9 1 M-0.2 0.4 L0.7 0.9 M0.4 -0.5 L1.3 -0.9 M0.4 -0.5 L1 0.3"
          fill="none"
          stroke={INK}
          strokeLinecap="round"
          strokeWidth="0.35"
        />
      </g>
      <g
        className="claude-octopus__x-siren"
        stroke="#60A5FA"
        strokeLinecap="round"
        strokeWidth="0.3"
      >
        <line x1="16.8" x2="18" y1="5.2" y2="5.2" />
        <line x1="16.6" x2="17.9" y1="6.2" y2="6.2" />
      </g>
    </g>
  ),
  planning: () => (
    <g className="claude-octopus__x">
      <Roadmap x={19.6} y={5.8} />
    </g>
  ),
  grooming: () => (
    <g className="claude-octopus__x">
      <Scissors x={19.8} y={5.6} />
    </g>
  ),
  speccing: () => (
    <g className="claude-octopus__x">
      <g transform="translate(18 4.6)">
        <rect
          fill="#FAFAF9"
          height="4"
          rx="0.3"
          stroke="#A8A29E"
          strokeWidth="0.2"
          width="3.6"
          x="0"
          y="0"
        />
        <rect
          fill="none"
          height="0.6"
          stroke="#22C55E"
          strokeWidth="0.2"
          width="0.6"
          x="0.5"
          y="0.7"
        />
        <path d="M0.6 1 L0.8 1.2 L1.1 0.8" fill="none" stroke="#22C55E" strokeWidth="0.2" />
        <rect fill="#A8A29E" height="0.35" width="1.6" x="1.4" y="0.8" />
        <rect
          fill="none"
          height="0.6"
          stroke="#22C55E"
          strokeWidth="0.2"
          width="0.6"
          x="0.5"
          y="1.8"
        />
        <rect fill="#A8A29E" height="0.35" width="1.6" x="1.4" y="1.9" />
        <rect
          fill="none"
          height="0.6"
          stroke="#A8A29E"
          strokeWidth="0.2"
          width="0.6"
          x="0.5"
          y="2.9"
        />
        <rect fill="#A8A29E" height="0.35" width="1.6" x="1.4" y="3" />
      </g>
    </g>
  ),
  scoping: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 5.8)">
        <circle cx="0" cy="0" fill="none" r="1.6" stroke="#EF4444" strokeWidth="0.3" />
        <circle cx="0" cy="0" fill="none" r="0.95" stroke="#EF4444" strokeWidth="0.3" />
        <circle cx="0" cy="0" fill="#EF4444" r="0.4" />
      </g>
    </g>
  ),
  descoping: () => (
    <g className="claude-octopus__x">
      <path d="M16.8 8 H22.4" stroke="#A8A29E" strokeDasharray="0.4 0.3" strokeWidth="0.3" />
      <Scissors x={19.8} y={5.6} />
    </g>
  ),
  yoloing: () => (
    <g className="claude-octopus__x">
      <Sunglasses x={12} y={9.4} />
      <Spark cls="claude-octopus__x-spark--1" s={0.6} x={20.4} y={5} />
    </g>
  ),
  freezing: () => (
    <g className="claude-octopus__x">
      <IceCube x={19.8} y={5.8} />
    </g>
  ),
  complying: () => (
    <g className="claude-octopus__x">
      <Shield fill="#22C55E" x={20} y={5.6} />
      <Doc accent="#22C55E" x={16.6} y={6} />
    </g>
  ),
  licensing: () => (
    <g className="claude-octopus__x">
      <Doc accent="#8B5CF6" x={17.8} y={4.6} />
      <g transform="translate(21 8)">
        <circle cx="0" cy="0" fill="#8B5CF6" r="1" />
        <text fill="#fff" fontSize="1.2" fontWeight="700" textAnchor="middle" x="0" y="0.42">
          ©
        </text>
      </g>
    </g>
  ),
  installing: () => (
    <g className="claude-octopus__x">
      <Download x={19.8} y={5.8} />
    </g>
  ),
  dockerizing: () => (
    <g className="claude-octopus__x">
      <Whale x={19.6} y={5.8} />
    </g>
  ),
  kubernetes: () => (
    <g className="claude-octopus__x">
      <Helm x={19.8} y={5.8} />
    </g>
  ),
  terraform: () => (
    <g className="claude-octopus__x">
      <Hook x={19.4} y={4} />
      <rect fill="#7C3AED" height="1.2" rx="0.15" width="1.6" x="18.6" y="6.4" />
      <rect fill="#A78BFA" height="1.2" rx="0.15" width="1.6" x="18.6" y="7.7" />
    </g>
  ),
  infra: () => (
    <g className="claude-octopus__x">
      <Factory x={19.6} y={6} />
    </g>
  ),
  serverless: () => (
    <g className="claude-octopus__x">
      <Cloud fill="#DBEAFE" x={19.6} y={5.6} />
    </g>
  ),
  edge: () => (
    <g className="claude-octopus__x">
      <Signal color="#3B82F6" x={18.6} y={6.6} />
      <Bolt x={21.6} y={5.2} />
    </g>
  ),
  multicloud: () => (
    <g className="claude-octopus__x">
      <Cloud fill="#E9D5FF" x={18.4} y={5} />
      <Cloud fill="#DBEAFE" x={20.4} y={6.6} />
    </g>
  ),
  localdev: () => (
    <g className="claude-octopus__x">
      <House accent="#22C55E" x={19.6} y={5.8} />
      <circle className="claude-octopus__x-siren" cx="21.6" cy="4.6" fill="#22C55E" r="0.4" />
    </g>
  ),
  remote: () => (
    <g className="claude-octopus__x">
      <House accent="#60A5FA" x={19} y={6} />
      <g
        className="claude-octopus__x-siren"
        fill="none"
        stroke="#60A5FA"
        strokeLinecap="round"
        strokeWidth="0.3"
      >
        <path d="M20.8 4.4 Q21.6 4.4 22 5" />
        <path d="M20.6 3.6 Q22 3.6 22.6 4.8" />
      </g>
    </g>
  ),
  hybrid: () => (
    <g className="claude-octopus__x">
      <g
        fill="none"
        stroke="#8B5CF6"
        strokeLinecap="round"
        strokeWidth="0.32"
        transform="translate(19.8 6)"
      >
        <path d="M-1.8 -0.8 H0.4 Q1.6 -0.8 1.6 0.8 H1.9" />
        <path d="M-1.8 0.8 H0.4 Q1.6 0.8 1.6 -0.8 H1.9" />
      </g>
      <path
        d="M21.5 5 L22.1 5.2 L21.7 5.7"
        fill="none"
        stroke="#8B5CF6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.3"
      />
      <path
        d="M21.5 7 L22.1 6.8 L21.7 6.3"
        fill="none"
        stroke="#8B5CF6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="0.3"
      />
    </g>
  ),
  async: () => (
    <g className="claude-octopus__x">
      <Hourglass x={19.8} y={5.8} />
    </g>
  ),
  awaiting: () => (
    <g className="claude-octopus__x">
      <g className="claude-octopus__x-gear" transform="translate(19.8 5.8)">
        <circle
          cx="0"
          cy="0"
          fill="none"
          opacity="0.3"
          r="1.5"
          stroke="#60A5FA"
          strokeWidth="0.4"
        />
        <path
          d="M0 -1.5 A1.5 1.5 0 0 1 1.5 0"
          fill="none"
          stroke="#2563EB"
          strokeLinecap="round"
          strokeWidth="0.4"
        />
      </g>
    </g>
  ),
  blocking: () => (
    <g className="claude-octopus__x">
      <Barrier x={19.6} y={5.4} />
    </g>
  ),
  deadlocked: () => (
    <g className="claude-octopus__x">
      <Lock cls="claude-octopus__x-siren" fill="#EF4444" x={19.8} y={5.8} />
    </g>
  ),
  racecondition: () => (
    <g className="claude-octopus__x">
      <RaceCar fill="#EF4444" x={18.8} y={5.4} />
      <RaceCar fill="#3B82F6" x={20.6} y={7.2} />
    </g>
  ),
  memoryleak: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.6 5)">
        <rect
          fill="#93C5FD"
          height="1.8"
          rx="0.2"
          stroke="#3B82F6"
          strokeWidth="0.2"
          width="2.6"
          x="-1.3"
          y="0"
        />
        <circle className="claude-octopus__x-drip" cx="-0.6" cy="2.2" fill="#3B82F6" r="0.25" />
        <circle className="claude-octopus__x-drip" cx="0.7" cy="2.2" fill="#3B82F6" r="0.2" />
      </g>
    </g>
  ),
  stackoverflowing: () => (
    <g className="claude-octopus__x">
      <BookStack x={19.6} y={5.6} />
    </g>
  ),
  copypasting: () => (
    <g className="claude-octopus__x">
      <g transform="translate(18.4 6)">
        <rect
          fill="#CBD5E1"
          height="2.4"
          rx="0.2"
          stroke="#94A3B8"
          strokeWidth="0.2"
          width="2"
          x="0"
          y="0"
        />
      </g>
      <g transform="translate(19.4 5)">
        <rect
          fill="#F8FAFC"
          height="2.4"
          rx="0.2"
          stroke="#94A3B8"
          strokeWidth="0.2"
          width="2"
          x="0"
          y="0"
        />
        <line stroke="#CBD5E1" strokeWidth="0.2" x1="0.4" x2="1.6" y1="0.7" y2="0.7" />
        <line stroke="#CBD5E1" strokeWidth="0.2" x1="0.4" x2="1.6" y1="1.3" y2="1.3" />
      </g>
    </g>
  ),
  vibecommit: () => (
    <g className="claude-octopus__x">
      <line stroke={INK} strokeWidth="0.35" x1="19.8" x2="19.8" y1="4.2" y2="8" />
      <circle cx="19.8" cy="6" fill="#8B5CF6" r="0.7" />
      <Spark cls="claude-octopus__x-spark--1" s={0.6} x={21.4} y={4.8} />
      <Spark cls="claude-octopus__x-spark--2" s={0.45} x={18} y={5} />
    </g>
  ),
  nocap: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.6 5.6)">
        <path d="M-1.4 0.4 Q-1.4 -1.4 0.4 -1.4 Q1.4 -1.4 1.4 0.4Z" fill="#EF4444" />
        <path d="M1.2 0.4 Q2.2 0.4 2.2 0.9 H1.2Z" fill="#DC2626" />
        <circle cx="0" cy="-1.3" fill="#B91C1C" r="0.2" />
      </g>
    </g>
  ),
  based: () => (
    <g className="claude-octopus__x">
      <Crown x={12} y={3.4} />
    </g>
  ),
  cooked: () => (
    <g className="claude-octopus__x">
      <Flame x={18.6} y={8.4} />
      <Flame cls="claude-octopus__x-flame--1" x={19.8} y={7.6} />
      <Flame x={21} y={8.4} />
    </g>
  ),
  delulu: () => (
    <g className="claude-octopus__x">
      <g transform="translate(12 3.6)">
        <path d="M0 -2 L0.5 0 H-0.5Z" fill="#F9A8D4" stroke="#EC4899" strokeWidth="0.15" />
        <path d="M-0.3 -0.8 L0.3 -0.5 M-0.2 -1.4 L0.3 -1.1" stroke="#fff" strokeWidth="0.15" />
      </g>
      <Spark cls="claude-octopus__x-spark--1" fill="#F472B6" s={0.6} x={9.6} y={4} />
      <Spark cls="claude-octopus__x-spark--2" fill="#A78BFA" s={0.5} x={14.4} y={4} />
    </g>
  ),
  maincharacter: () => (
    <g className="claude-octopus__x">
      <path d="M12 2.6 L19 20 H5Z" fill="#FDE68A" opacity="0.25" />
      <Star fill="#FBBF24" r={1.7} x={19.8} y={5.4} />
      <Spark cls="claude-octopus__x-spark--2" s={0.5} x={17.8} y={4.4} />
    </g>
  ),
  sidequest: () => (
    <g className="claude-octopus__x">
      <Roadmap x={19} y={5.8} />
      <g transform="translate(21.8 8)">
        <path d="M0 0 Q-0.7 -0.7 0 -1.4 Q0.7 -0.7 0 0Z" fill="#22C55E" />
        <circle cx="0" cy="-0.9" fill="#fff" r="0.22" />
      </g>
    </g>
  ),
  bossfight: () => (
    <g className="claude-octopus__x">
      <Monster x={19.8} y={5.8} />
    </g>
  ),
  leveling: () => (
    <g className="claude-octopus__x">
      <Signal color="#22C55E" x={18.4} y={6.6} />
      <Star fill="#FBBF24" r={0.7} x={21.6} y={4.6} />
    </g>
  ),
  grinding: () => (
    <g className="claude-octopus__x">
      <Gear x={19.8} y={6} />
      <path
        className="claude-octopus__x-drip"
        d="M21.6 4.4 Q22 5 21.6 5.4 Q21.2 5 21.6 4.4Z"
        fill="#60A5FA"
      />
    </g>
  ),
  respawning: () => (
    <g className="claude-octopus__x">
      <g className="claude-octopus__x-gear" transform="translate(19.8 5.8)">
        <path
          d="M1.4 -0.6 A1.5 1.5 0 1 0 1.5 0.9"
          fill="none"
          stroke="#8B5CF6"
          strokeLinecap="round"
          strokeWidth="0.4"
        />
        <path d="M1.4 -1.4 L1.7 -0.4 L0.7 -0.6Z" fill="#8B5CF6" />
      </g>
      <Spark cls="claude-octopus__x-spark--1" fill="#C4B5FD" s={0.6} x={19.8} y={5.8} />
    </g>
  ),
  permadeath: () => (
    <g className="claude-octopus__x">
      <Skull x={19.8} y={5.8} />
    </g>
  ),
  speedrunning: () => (
    <g className="claude-octopus__x">
      <CheckerFlag x={18.6} y={8} />
    </g>
  ),
  minmaxing: () => (
    <g className="claude-octopus__x">
      <g transform="translate(18 8.6)">
        <rect
          className="claude-octopus__x-bar claude-octopus__x-bar--3"
          fill="#22C55E"
          height="4"
          rx="0.1"
          width="0.9"
          x="0"
          y="-4"
        />
        <rect
          className="claude-octopus__x-bar claude-octopus__x-bar--1"
          fill="#EF4444"
          height="1.2"
          rx="0.1"
          width="0.9"
          x="1.4"
          y="-1.2"
        />
        <rect
          className="claude-octopus__x-bar claude-octopus__x-bar--2"
          fill="#22C55E"
          height="3.4"
          rx="0.1"
          width="0.9"
          x="2.8"
          y="-3.4"
        />
      </g>
    </g>
  ),
  theorycraft: () => (
    <g className="claude-octopus__x">
      <Brain x={19.8} y={5.6} />
    </g>
  ),
  metagaming: () => (
    <g className="claude-octopus__x">
      <Dice x={19.8} y={5.8} />
    </g>
  ),
  modding: () => (
    <g className="claude-octopus__x">
      <Wrench x={19.8} y={5.8} />
    </g>
  ),
  plugin: () => (
    <g className="claude-octopus__x">
      <Puzzle fill="#22C55E" x={19.4} y={5.8} />
      <g stroke="#22C55E" strokeLinecap="round" strokeWidth="0.4" transform="translate(21.6 4.6)">
        <line x1="0" x2="0" y1="-0.7" y2="0.7" />
        <line x1="-0.7" x2="0.7" y1="0" y2="0" />
      </g>
    </g>
  ),
  extending: () => (
    <g className="claude-octopus__x">
      <Puzzle fill="#8B5CF6" x={18.6} y={5.8} />
      <Puzzle fill="#A78BFA" x={21} y={5.8} />
    </g>
  ),
  hooking: () => (
    <g className="claude-octopus__x">
      <Hook x={19.6} y={5.6} />
      <Spark cls="claude-octopus__x-spark--2" s={0.5} x={21.4} y={7} />
    </g>
  ),
  scripting: () => (
    <g className="claude-octopus__x">
      <Terminal x={19.4} y={6} />
    </g>
  ),
  automating: () => (
    <g className="claude-octopus__x">
      <Robot x={19.6} y={6} />
    </g>
  ),
  workflow: () => (
    <g className="claude-octopus__x">
      <g transform="translate(17.4 6)">
        <line stroke={INK} strokeWidth="0.3" x1="0" x2="4.6" y1="0" y2="0" />
        <circle cx="0" cy="0" fill="#60A5FA" r="0.6" />
        <rect
          className="claude-octopus__x-node"
          fill="#8B5CF6"
          height="1.2"
          rx="0.2"
          width="1.2"
          x="1.7"
          y="-0.6"
        />
        <circle cx="4.6" cy="0" fill="#22C55E" r="0.6" />
      </g>
    </g>
  ),
  n8n: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 5.8)">
        <path d="M-1.4 -1 Q0 0 1.4 1" fill="none" stroke="#EA4B71" strokeWidth="0.3" />
        <circle className="claude-octopus__x-node" cx="-1.4" cy="-1" fill="#EA4B71" r="0.6" />
        <circle cx="1.4" cy="1" fill="#EA4B71" r="0.6" />
      </g>
    </g>
  ),
  zapier: () => (
    <g className="claude-octopus__x">
      <g transform="translate(19.8 5.8)">
        <path d="M0 -1.8 L1.6 -0.9 V0.9 L0 1.8 L-1.6 0.9 V-0.9Z" fill="#FF4A00" />
        <path
          className="claude-octopus__x-bolt"
          d="M0.3 -1 L-0.7 0.2 H0 L-0.3 1.1 L0.8 -0.2 H0.05 L0.5 -1Z"
          fill="#fff"
        />
      </g>
    </g>
  ),
  aiwrapping: () => (
    <g className="claude-octopus__x">
      <Gift x={19.8} y={5.8} />
    </g>
  ),
  promptinject: () => (
    <g className="claude-octopus__x">
      <Syringe x={19.8} y={5.8} />
    </g>
  ),
  agentswarm: () => (
    <g className="claude-octopus__x">
      <g className="claude-octopus__x-node" transform="translate(18.4 5.4)">
        <circle cx="0" cy="0" fill="#D97757" r="0.7" />
        <path
          d="M-0.6 0.5 L-0.9 1.1 M0 0.6 L0 1.2 M0.6 0.5 L0.9 1.1"
          stroke="#D97757"
          strokeLinecap="round"
          strokeWidth="0.25"
        />
      </g>
      <g transform="translate(20.6 6)">
        <circle cx="0" cy="0" fill="#C96442" r="0.6" />
        <path
          d="M-0.5 0.4 L-0.8 0.9 M0 0.5 L0 1 M0.5 0.4 L0.8 0.9"
          stroke="#C96442"
          strokeLinecap="round"
          strokeWidth="0.22"
        />
      </g>
      <circle cx="21.4" cy="4.4" fill="#D97757" r="0.5" />
    </g>
  ),
};

/**
 * Render a bespoke overlay for an extended pose id.
 *
 * @param id - Extended pose id.
 * @returns Overlay nodes, or null when the pose has no bespoke overlay.
 * @example
 * extendedPoseOverlay('debugging');
 */
export const extendedPoseOverlay = (id: string): ReactNode | null => {
  const make = OVERLAYS[id];
  return make ? make() : null;
};

/** Ids that already have a bespoke overlay (rest still fall back to the glyph). */
export const EXTENDED_POSE_OVERLAY_IDS: readonly string[] = Object.keys(OVERLAYS);
