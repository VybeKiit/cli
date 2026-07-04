/**
 * Deluxe Claude octopus scene registry.
 *
 * Each scene is a full illustration composed from `sceneParts` on the shared
 * 320×220 world (ground ≈ y158). A scene declares a `focus` rect so smaller
 * canvases (square / inline) can crop to what matters. `render()` returns the SVG
 * body; `ClaudeOctopusScene` wraps it in the `<svg>` and picks the viewBox.
 *
 * Layout conventions:
 *  - Desk scenes (working, debugging, reviewing, prompting, coffee, sleeping) share
 *    the `DeskScene` helper: backdrop → chair → Claude → desk → MacBook → mug.
 *  - Portrait scenes center Claude ~x168 with props layered around; background props
 *    render before the hero, foreground props after.
 */
import type { ReactNode } from 'react';

import {
  CoffeeMug,
  ConfettiField,
  Desk,
  MacBook,
  OctopusBody,
  OfficeChair,
  SceneBackdrop,
  SCENE_INK,
  SCENE_INK_SOFT,
  type OctopusExpression,
} from './sceneParts';

export interface SceneFocus {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface ClaudeOctopusSceneDef {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly focus: SceneFocus;
  render(): ReactNode;
}

export const SCENE_WORLD = { width: 320, height: 220 } as const;
const FULL_FOCUS: SceneFocus = { x: 56, y: 18, w: 208, h: 184 };
const DESK_FOCUS: SceneFocus = { x: 70, y: 44, w: 190, h: 150 };
const PORTRAIT_FOCUS: SceneFocus = { x: 96, y: 26, w: 148, h: 168 };

// ————————————————————————————————————————————————————————————————
// Shared desk layout
// ————————————————————————————————————————————————————————————————

function DeskScene({
  backdropId,
  from,
  to,
  screen,
  screenGlow = true,
  expression = 'focused',
  heroClass = 'claude-scene__hero',
  mug = true,
  children,
}: {
  readonly backdropId: string;
  readonly from: string;
  readonly to: string;
  readonly screen?: ReactNode;
  readonly screenGlow?: boolean;
  readonly expression?: OctopusExpression;
  readonly heroClass?: string;
  readonly mug?: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <>
      <SceneBackdrop from={from} id={backdropId} to={to} />
      <OfficeChair className="claude-scene__chair" scale={0.9} x={165} y={150} />
      <OctopusBody className={heroClass} expression={expression} size={72} x={128} y={70} />
      <Desk width={320} x={0} y={158} />
      <MacBook
        className="claude-scene__mac"
        scale={1.15}
        screen={screen}
        screenGlow={screenGlow}
        x={92}
        y={158}
      />
      {mug ? <CoffeeMug className="claude-scene__mug" scale={0.9} x={258} y={156} /> : null}
      {children}
    </>
  );
}

// ————————————————————————————————————————————————————————————————
// MacBook screen variants (authored in the 48×32 screen space)
// ————————————————————————————————————————————————————————————————

function ScreenChrome({ bg = '#0F0F0F' }: { readonly bg?: string }) {
  return (
    <>
      <rect fill={bg} height="32" rx="1.4" width="48" x="0" y="0" />
      <rect fill="#2A2A2A" height="4" width="48" x="0" y="0" />
      <circle cx="3" cy="2" fill="#FF5F57" r="0.8" />
      <circle cx="6" cy="2" fill="#FEBC2E" r="0.8" />
      <circle cx="9" cy="2" fill="#28C840" r="0.8" />
    </>
  );
}

function TerminalScreen() {
  return (
    <g className="claude-scene__terminal">
      <ScreenChrome />
      <rect fill="#569CD6" height="1.6" rx="0.5" width="10" x="4" y="8" />
      <rect fill="#CE9178" height="1.6" rx="0.5" width="26" x="16" y="8" />
      <rect fill="#6A9955" height="1.6" rx="0.5" width="20" x="4" y="12" />
      <rect fill="#D4D4D4" height="1.6" rx="0.5" width="30" x="4" y="16" />
      <rect fill="#D4D4D4" height="1.6" rx="0.5" width="16" x="4" y="20" />
      <rect className="claude-scene__caret" fill="#D97757" height="1.8" width="1.4" x="22" y="20" />
    </g>
  );
}

function DiffScreen() {
  return (
    <g>
      <ScreenChrome />
      <rect fill="#3B2A1E" height="2.4" width="48" x="0" y="7" />
      <rect fill="#F87171" height="1.4" rx="0.4" width="4" x="2" y="7.5" />
      <rect fill="#FCA5A5" height="1.4" rx="0.4" width="26" x="8" y="7.5" />
      <rect fill="#1E3A2A" height="2.4" width="48" x="0" y="11" />
      <rect fill="#4ADE80" height="1.4" rx="0.4" width="4" x="2" y="11.5" />
      <rect fill="#86EFAC" height="1.4" rx="0.4" width="30" x="8" y="11.5" />
      <rect fill="#1E3A2A" height="2.4" width="48" x="0" y="15" />
      <rect fill="#4ADE80" height="1.4" rx="0.4" width="4" x="2" y="15.5" />
      <rect fill="#86EFAC" height="1.4" rx="0.4" width="22" x="8" y="15.5" />
      <rect fill="#D4D4D4" height="1.4" rx="0.4" width="18" x="8" y="20" />
    </g>
  );
}

function PromptScreen() {
  return (
    <g>
      <ScreenChrome bg="#151519" />
      <rect
        fill="#26262E"
        height="10"
        rx="1.6"
        stroke="#3F3F46"
        strokeWidth="0.4"
        width="42"
        x="3"
        y="9"
      />
      <text fill="#D97757" fontSize="2.2" x="5" y="12.4">
        ›
      </text>
      <rect fill="#A1A1AA" height="1.5" rx="0.5" width="24" x="8" y="11" />
      <rect className="claude-scene__caret" fill="#D97757" height="2" width="1.3" x="33" y="10.6" />
      <text className="claude-scene__prompt-spark" fill="#FBBF24" fontSize="3" x="40" y="7">
        ✦
      </text>
    </g>
  );
}

function ErrorScreen() {
  return (
    <g>
      <rect fill="#2A1113" height="32" rx="1.4" width="48" x="0" y="0" />
      <path
        className="claude-scene__err-mark"
        d="M24 6 L31 20 H17 Z"
        fill="none"
        stroke="#F87171"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <rect fill="#F87171" height="4" rx="0.6" width="1.4" x="23.3" y="11" />
      <circle cx="24" cy="17.5" fill="#F87171" r="0.9" />
      <rect fill="#7F1D1D" height="1.4" rx="0.4" width="20" x="14" y="24" />
    </g>
  );
}

function BugScreen() {
  return (
    <g>
      <ScreenChrome />
      <rect fill="#D4D4D4" height="1.5" rx="0.4" width="20" x="4" y="8" />
      <rect fill="#D4D4D4" height="1.5" rx="0.4" width="28" x="4" y="12" />
      <path d="M4 18 q3 1.4 6 0 t6 0 t6 0" fill="none" stroke="#F87171" strokeWidth="0.6" />
      <rect fill="#D4D4D4" height="1.5" rx="0.4" width="14" x="4" y="21" />
      <g transform="translate(36 20)">
        <g className="claude-scene__screen-bug">
          <ellipse cx="0" cy="0" fill="#DC2626" rx="2.4" ry="3" />
          <line stroke="#7F1D1D" strokeWidth="0.4" x1="-2.4" x2="2.4" y1="0" y2="0" />
          <line
            stroke="#DC2626"
            strokeLinecap="round"
            strokeWidth="0.5"
            x1="-2.4"
            x2="-4"
            y1="-1.6"
            y2="-2.6"
          />
          <line
            stroke="#DC2626"
            strokeLinecap="round"
            strokeWidth="0.5"
            x1="2.4"
            x2="4"
            y1="-1.6"
            y2="-2.6"
          />
        </g>
      </g>
    </g>
  );
}

// ————————————————————————————————————————————————————————————————
// Portrait props
// ————————————————————————————————————————————————————————————————

function ThoughtBubble({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="claude-scene__thought">
        <circle cx="-14" cy="16" fill="#fff" r="2" stroke="#D4D4D8" strokeWidth="0.8" />
        <circle cx="-9" cy="10" fill="#fff" r="3" stroke="#D4D4D8" strokeWidth="0.8" />
        <ellipse cx="4" cy="0" fill="#fff" rx="18" ry="12" stroke="#D4D4D8" strokeWidth="1" />
        <g stroke={SCENE_INK_SOFT} strokeLinecap="round" strokeWidth="1.4" fill="none">
          <circle cx="4" cy="0" r="4.4" />
          <path d="M4 -8 v2 M4 6 v2 M-4 0 h2 M10 0 h2" />
        </g>
      </g>
    </g>
  );
}

function Lightbulb({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g
        className="claude-scene__bulb-rays"
        stroke="#FBBF24"
        strokeLinecap="round"
        strokeWidth="1.4"
      >
        <line x1="0" x2="0" y1="-16" y2="-11" />
        <line x1="-11" x2="-7.5" y1="-11" y2="-7.5" />
        <line x1="11" x2="7.5" y1="-11" y2="-7.5" />
        <line x1="-15" x2="-10" y1="0" y2="0" />
        <line x1="15" x2="10" y1="0" y2="0" />
      </g>
      <g className="claude-scene__bulb">
        <circle cx="0" cy="0" fill="#FDE68A" r="7" stroke="#F59E0B" strokeWidth="1" />
        <path d="M-2 6 h4 l-0.6 3 h-2.8 Z" fill="#9CA3AF" />
        <rect fill="#6B7280" height="1.4" width="4.6" x="-2.3" y="9" />
      </g>
    </g>
  );
}

function MoneyFloat({
  x,
  y,
  delay,
}: {
  readonly x: number;
  readonly y: number;
  readonly delay: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="claude-scene__money" style={{ animationDelay: delay }}>
        <rect
          fill="#4ADE80"
          height="9"
          rx="1"
          stroke="#16A34A"
          strokeWidth="0.6"
          width="15"
          x="-7.5"
          y="-4.5"
        />
        <circle cx="0" cy="0" fill="none" r="2.4" stroke="#16A34A" strokeWidth="0.8" />
        <text fill="#16A34A" fontSize="4" fontWeight="700" textAnchor="middle" x="0" y="1.6">
          $
        </text>
      </g>
    </g>
  );
}

function Zzz({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g fill={SCENE_INK_SOFT} fontWeight="700" transform={`translate(${x} ${y})`}>
      <text className="claude-scene__zzz claude-scene__zzz--1" fontSize="8" x="0" y="0">
        z
      </text>
      <text className="claude-scene__zzz claude-scene__zzz--2" fontSize="6" x="7" y="-7">
        z
      </text>
      <text className="claude-scene__zzz claude-scene__zzz--3" fontSize="4.4" x="12" y="-13">
        z
      </text>
    </g>
  );
}

function Heart({
  x,
  y,
  scale,
  cls,
}: {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly cls: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        className={`claude-scene__heart ${cls}`}
        d="M0 3 C-4 -1 -2 -5 0 -1.6 C2 -5 4 -1 0 3Z"
        fill="#F43F5E"
      />
    </g>
  );
}

function MusicNote({
  x,
  y,
  cls,
}: {
  readonly x: number;
  readonly y: number;
  readonly cls: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={`claude-scene__note ${cls}`} fill={SCENE_INK}>
        <rect height="8" rx="0.4" width="1.3" x="2.6" y="-8" />
        <ellipse cx="1" cy="0.4" rx="2.4" ry="1.8" transform="rotate(-20 1 0.4)" />
        <path d="M3.9 -8 q3 0.6 3 3 q-1.4 -1.8 -3 -1.2Z" />
      </g>
    </g>
  );
}

function SweatDrop({
  x,
  y,
  cls,
}: {
  readonly x: number;
  readonly y: number;
  readonly cls: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        className={`claude-scene__sweat ${cls}`}
        d="M0 -3 C2 0 2.4 3 0 3 C-2.4 3 -2 0 0 -3Z"
        fill="#7DD3FC"
      />
    </g>
  );
}

function Shades({ cx, cy }: { readonly cx: number; readonly cy: number }) {
  return (
    <g fill={SCENE_INK} transform={`translate(${cx} ${cy})`}>
      <rect height="10" rx="2.4" width="17" x="-24" y="-5" />
      <rect height="10" rx="2.4" width="17" x="7" y="-5" />
      <path d="M-7 -3 q7 -3 14 0" fill="none" stroke={SCENE_INK} strokeWidth="2.4" />
    </g>
  );
}

function Headphones({ cx, cy }: { readonly cx: number; readonly cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <path
        d="M-30 4 Q0 -30 30 4"
        fill="none"
        stroke="#3F3F46"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <rect fill="#3F3F46" height="16" rx="3" width="9" x="-33" y="2" />
      <rect fill="#3F3F46" height="16" rx="3" width="9" x="24" y="2" />
    </g>
  );
}

function RainCloud({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="0" fill="#94A3B8" rx="20" ry="10" />
      <ellipse cx="-12" cy="2" fill="#94A3B8" rx="10" ry="7" />
      <ellipse cx="12" cy="2" fill="#94A3B8" rx="10" ry="7" />
      <line
        className="claude-scene__rain claude-scene__rain--1"
        stroke="#60A5FA"
        strokeLinecap="round"
        strokeWidth="1.4"
        x1="-10"
        x2="-10"
        y1="10"
        y2="16"
      />
      <line
        className="claude-scene__rain claude-scene__rain--2"
        stroke="#60A5FA"
        strokeLinecap="round"
        strokeWidth="1.4"
        x1="0"
        x2="0"
        y1="10"
        y2="16"
      />
      <line
        className="claude-scene__rain claude-scene__rain--3"
        stroke="#60A5FA"
        strokeLinecap="round"
        strokeWidth="1.4"
        x1="10"
        x2="10"
        y1="10"
        y2="16"
      />
    </g>
  );
}

function AlertTriangle({
  x,
  y,
  cls,
}: {
  readonly x: number;
  readonly y: number;
  readonly cls: string;
}) {
  return (
    <g className={`claude-scene__alert ${cls}`} transform={`translate(${x} ${y})`}>
      <path
        d="M0 -9 L10 9 H-10 Z"
        fill="#EF4444"
        stroke="#B91C1C"
        strokeLinejoin="round"
        strokeWidth="1"
      />
      <rect fill="#fff" height="6" rx="0.7" width="1.8" x="-0.9" y="-3" />
      <circle cx="0" cy="6" fill="#fff" r="1.1" />
    </g>
  );
}

function GitGraph({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 22 V6 Q0 0 8 0 H16" fill="none" stroke="#8B5CF6" strokeWidth="2.4" />
      <path d="M32 22 V6 Q32 0 24 0 H16" fill="none" stroke="#22C55E" strokeWidth="2.4" />
      <line stroke="#94A3B8" strokeWidth="2.4" x1="16" x2="16" y1="0" y2="-14" />
      <circle cx="0" cy="22" fill="#8B5CF6" r="3.4" />
      <circle cx="32" cy="22" fill="#22C55E" r="3.4" />
      <circle className="claude-scene__merge-node" cx="16" cy="-14" fill="#F59E0B" r="4" />
    </g>
  );
}

function WrenchFlame({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        className="claude-scene__wrench"
        d="M-8 8 L2 -2 A4 4 0 0 0 8 -8 L4 -4 L1 -7 L5 -11 A4 4 0 0 0 -1 -5 L-11 5 Z"
        fill="#9CA3AF"
        stroke="#6B7280"
        strokeWidth="0.6"
      />
      <path
        className="claude-scene__flame claude-scene__flame--1"
        d="M6 -12 q4 -6 0 -12 q-1 4 -4 5 q3 3 4 7Z"
        fill="#F97316"
      />
      <path
        className="claude-scene__flame claude-scene__flame--2"
        d="M6 -12 q2 -4 0 -8 q-0.6 2.5 -2.4 3.4 q2 1.6 2.4 4.6Z"
        fill="#FBBF24"
      />
    </g>
  );
}

function Star({ cx, cy, r }: { readonly cx: number; readonly cy: number; readonly r: number }) {
  return (
    <path
      className="claude-scene__star"
      d={`M${cx} ${cy - r} L${cx + r * 0.3} ${cy - r * 0.3} L${cx + r} ${cy} L${cx + r * 0.3} ${cy + r * 0.3} L${cx} ${cy + r} L${cx - r * 0.3} ${cy + r * 0.3} L${cx - r} ${cy} L${cx - r * 0.3} ${cy - r * 0.3} Z`}
      fill="#FBBF24"
    />
  );
}

// ————————————————————————————————————————————————————————————————
// Scene-specific set pieces (deploying, shipped)
// ————————————————————————————————————————————————————————————————

function Popper({
  x,
  y,
  mirror,
}: {
  readonly x: number;
  readonly y: number;
  readonly mirror: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${mirror ? -1 : 1} 1)`}>
      <path d="M0 0 L18 -6 L14 6 Z" fill="#D97757" />
      <path
        className="claude-scene__popper-streamer"
        d="M18 -6 q10 -6 18 -2"
        fill="none"
        stroke="#34D399"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        className="claude-scene__popper-streamer"
        d="M18 -2 q12 0 20 6"
        fill="none"
        stroke="#60A5FA"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        className="claude-scene__popper-streamer"
        d="M18 2 q10 6 16 12"
        fill="none"
        stroke="#FBBF24"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </g>
  );
}

function Rocket({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 q10 -28 20 0 L20 60 L0 60 Z" fill="#E5E7EB" />
      <path d="M0 0 q10 -28 20 0 L20 14 L0 14 Z" fill="#D97757" />
      <circle cx="10" cy="26" fill="#93C5FD" r="5" stroke="#1E3A8A" strokeWidth="1.5" />
      <path d="M0 46 L-8 62 L0 58 Z" fill="#B91C1C" />
      <path d="M20 46 L28 62 L20 58 Z" fill="#B91C1C" />
    </g>
  );
}

function SmokeCloud({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g className="claude-scene__smoke" transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="0" fill="#E2E8F0" r="9" />
      <circle cx="10" cy="2" fill="#EDF2F7" r="7" />
      <circle cx="-9" cy="3" fill="#EDF2F7" r="6" />
    </g>
  );
}

function DiscoBall({ x, y }: { readonly x: number; readonly y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line stroke="#94A3B8" strokeWidth="1" x1="0" x2="0" y1="-18" y2="-6" />
      <g className="claude-scene__disco">
        <circle cx="0" cy="0" fill="#A5B4FC" r="6" />
        <path d="M-6 0 H6 M0 -6 V6 M-4 -4 L4 4 M4 -4 L-4 4" stroke="#6366F1" strokeWidth="0.5" />
      </g>
    </g>
  );
}

// ————————————————————————————————————————————————————————————————
// Registry
// ————————————————————————————————————————————————————————————————

const SCENES: readonly ClaudeOctopusSceneDef[] = [
  {
    id: 'working-at-mac',
    label: 'Working at the Mac',
    description: 'Claude at the desk, coding on a real MacBook with coffee close by.',
    focus: DESK_FOCUS,
    render() {
      return (
        <DeskScene
          backdropId="scene-working"
          from="#FFF8F4"
          heroClass="claude-scene__hero claude-scene__hero--type"
          screen={<TerminalScreen />}
          to="#F7E7DD"
        />
      );
    },
  },
  {
    id: 'prompting',
    label: 'Prompting',
    description: 'Writing the magic words — a prompt box, a caret, and a spark of intent.',
    focus: DESK_FOCUS,
    render() {
      return (
        <DeskScene
          backdropId="scene-prompting"
          from="#FBF7FF"
          heroClass="claude-scene__hero claude-scene__hero--type"
          screen={<PromptScreen />}
          to="#EFE4FF"
        />
      );
    },
  },
  {
    id: 'debugging',
    label: 'Debugging',
    description: 'Magnifier out, squinting at a bug that only shows up at 2am.',
    focus: DESK_FOCUS,
    render() {
      return (
        <DeskScene
          backdropId="scene-debug"
          expression="focused"
          from="#FFFDF4"
          screen={<BugScreen />}
          to="#F5EFD8"
        >
          <g transform="translate(196 96)">
            <g className="claude-scene__loupe">
              <circle
                cx="0"
                cy="0"
                fill="rgba(191,219,254,0.35)"
                r="11"
                stroke="#334155"
                strokeWidth="2.4"
              />
              <line
                stroke="#334155"
                strokeLinecap="round"
                strokeWidth="3.4"
                x1="8"
                x2="17"
                y1="8"
                y2="17"
              />
            </g>
          </g>
        </DeskScene>
      );
    },
  },
  {
    id: 'reviewing',
    label: 'Code review',
    description: 'Reading glasses on, weighing the diff before the merge.',
    focus: DESK_FOCUS,
    render() {
      return (
        <DeskScene backdropId="scene-review" from="#F4FAFF" screen={<DiffScreen />} to="#DEEEFB">
          <g transform="translate(128 70)">
            <g transform="translate(0 0) scale(3)">
              {/* reading glasses over the eye cutouts (octopus local space) */}
              <rect
                fill="none"
                height="2.4"
                rx="0.5"
                stroke={SCENE_INK}
                strokeWidth="0.4"
                width="3"
                x="5.2"
                y="8.4"
              />
              <rect
                fill="none"
                height="2.4"
                rx="0.5"
                stroke={SCENE_INK}
                strokeWidth="0.4"
                width="3"
                x="15.8"
                y="8.4"
              />
              <line stroke={SCENE_INK} strokeWidth="0.4" x1="8.2" x2="15.8" y1="9.2" y2="9.2" />
            </g>
          </g>
        </DeskScene>
      );
    },
  },
  {
    id: 'coffee',
    label: 'Coffee break',
    description: 'Powered by espresso and prompts — a warm pause between commits.',
    focus: DESK_FOCUS,
    render() {
      return (
        <DeskScene
          backdropId="scene-coffee"
          expression="happy"
          from="#FFF6EE"
          heroClass="claude-scene__hero claude-scene__hero--sip"
          screen={<TerminalScreen />}
          screenGlow={false}
          to="#F0E0CE"
        >
          <CoffeeMug className="claude-scene__mug" scale={1.5} x={150} y={150} />
        </DeskScene>
      );
    },
  },
  {
    id: 'sleeping',
    label: 'Sleeping',
    description: 'Laptop dimmed, Zzz rising — the agent is idle for the night.',
    focus: DESK_FOCUS,
    render() {
      return (
        <DeskScene
          backdropId="scene-sleep"
          expression="sleepy"
          from="#EEF0F7"
          heroClass="claude-scene__hero claude-scene__hero--lean"
          mug={false}
          screen={
            <g>
              <rect fill="#0A0A0A" height="32" rx="1.4" width="48" x="0" y="0" />
            </g>
          }
          screenGlow={false}
          to="#DDE0EC"
        >
          <Zzz x={196} y={78} />
        </DeskScene>
      );
    },
  },
  {
    id: 'broke',
    label: 'Build broke',
    description: 'Red across the board — the build went down and morale with it.',
    focus: DESK_FOCUS,
    render() {
      return (
        <DeskScene
          backdropId="scene-broke"
          expression="sad"
          from="#FFF1F0"
          heroClass="claude-scene__hero claude-scene__hero--slump"
          mug={false}
          screen={<ErrorScreen />}
          screenGlow={false}
          to="#FAD4D2"
        />
      );
    },
  },
  {
    id: 'shipped',
    label: 'Shipped it',
    description: 'PR merged — confetti everywhere and a very happy Claude.',
    focus: { x: 92, y: 24, w: 150, h: 168 },
    render() {
      return (
        <>
          <SceneBackdrop from="#F3FBF6" id="scene-shipped" to="#E7F6EE" />
          <ConfettiField
            className="claude-scene__confetti-field"
            count={30}
            width={320}
            x={0}
            y={4}
          />
          <OctopusBody
            className="claude-scene__hero claude-scene__hero--hop"
            expression="happy"
            size={88}
            x={124}
            y={70}
          />
          <g transform="translate(128 176)">
            <g
              className="claude-scene__badge"
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <rect
                fill="#DCFCE7"
                height="20"
                rx="10"
                stroke="#22C55E"
                strokeWidth="1.5"
                width="64"
                x="0"
                y="0"
              />
              <path
                d="M12 10 l3 3 l6 -6"
                fill="none"
                stroke="#16A34A"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
              <rect fill="#16A34A" height="2.4" rx="1.2" width="30" x="26" y="8.8" />
            </g>
          </g>
          <Popper mirror={false} x={44} y={168} />
          <Popper mirror={true} x={276} y={168} />
        </>
      );
    },
  },
  {
    id: 'celebrating',
    label: 'Celebrating',
    description: 'Green CI never felt so good — dancing under a disco ball.',
    focus: PORTRAIT_FOCUS,
    render() {
      return (
        <>
          <SceneBackdrop from="#FFF4FB" id="scene-celebrate" to="#FBE3F4" />
          <ConfettiField
            className="claude-scene__confetti-field"
            count={22}
            width={320}
            x={0}
            y={4}
          />
          <DiscoBall x={160} y={26} />
          <OctopusBody
            className="claude-scene__hero claude-scene__hero--dance"
            expression="happy"
            size={80}
            x={128}
            y={78}
          />
          <MusicNote cls="claude-scene__note--a" x={70} y={120} />
          <MusicNote cls="claude-scene__note--b" x={232} y={104} />
        </>
      );
    },
  },
  {
    id: 'first-sale',
    label: 'First sale',
    description: 'Stripe ping hit while you were vibing — floating dollars incoming.',
    focus: PORTRAIT_FOCUS,
    render() {
      return (
        <>
          <SceneBackdrop from="#F1FBF4" id="scene-sale" to="#DCF5E4" />
          <OctopusBody
            className="claude-scene__hero claude-scene__hero--hop"
            expression="happy"
            size={82}
            x={126}
            y={74}
          />
          <MoneyFloat delay="0s" x={72} y={150} />
          <MoneyFloat delay="0.5s" x={248} y={140} />
          <MoneyFloat delay="1s" x={230} y={186} />
          <MoneyFloat delay="0.3s" x={92} y={196} />
        </>
      );
    },
  },
  {
    id: 'eureka',
    label: 'Eureka',
    description: 'The lightbulb pops — it finally compiled.',
    focus: PORTRAIT_FOCUS,
    render() {
      return (
        <>
          <SceneBackdrop from="#FFFDF2" id="scene-eureka" to="#FCF3D4" />
          <Lightbulb x={168} y={34} />
          <OctopusBody
            className="claude-scene__hero claude-scene__hero--pop"
            expression="happy"
            size={82}
            x={126}
            y={78}
          />
        </>
      );
    },
  },
  {
    id: 'loving',
    label: 'In love',
    description: 'The agent nailed it first try — heart eyes all around.',
    focus: PORTRAIT_FOCUS,
    render() {
      return (
        <>
          <SceneBackdrop from="#FFF3F5" id="scene-loving" to="#FCDCE4" />
          <OctopusBody
            className="claude-scene__hero claude-scene__hero--float"
            expression="loving"
            size={82}
            x={126}
            y={74}
          />
          <Heart cls="claude-scene__heart--1" scale={3} x={78} y={150} />
          <Heart cls="claude-scene__heart--2" scale={2.2} x={244} y={132} />
          <Heart cls="claude-scene__heart--3" scale={2.6} x={226} y={188} />
        </>
      );
    },
  },
  {
    id: 'vibing',
    label: 'Vibing',
    description: 'Shades on, headphones up — flow state unlocked.',
    focus: PORTRAIT_FOCUS,
    render() {
      return (
        <>
          <SceneBackdrop from="#EFF4FF" id="scene-vibing" to="#D8E2FB" />
          <OctopusBody
            className="claude-scene__hero claude-scene__hero--sway"
            expression="cool"
            size={84}
            x={126}
            y={74}
          />
          <g transform="translate(168 104)">
            <Headphones cx={0} cy={0} />
          </g>
          <MusicNote cls="claude-scene__note--a" x={70} y={116} />
          <MusicNote cls="claude-scene__note--b" x={238} y={128} />
        </>
      );
    },
  },
  {
    id: 'thinking',
    label: 'Thinking',
    description: 'Hmm — let me vibe on that. Gears turning in a thought bubble.',
    focus: PORTRAIT_FOCUS,
    render() {
      return (
        <>
          <SceneBackdrop from="#F7F8FA" id="scene-think" to="#E6E9F0" />
          <OctopusBody
            className="claude-scene__hero claude-scene__hero--think"
            expression="focused"
            size={80}
            x={116}
            y={82}
          />
          <ThoughtBubble x={214} y={58} />
        </>
      );
    },
  },
  {
    id: 'merging',
    label: 'Merging',
    description: 'Two branches, one node — the merge lands clean.',
    focus: PORTRAIT_FOCUS,
    render() {
      return (
        <>
          <SceneBackdrop from="#F6F3FF" id="scene-merge" to="#E4DBFA" />
          <OctopusBody
            className="claude-scene__hero"
            expression="focused"
            size={78}
            x={128}
            y={72}
          />
          <GitGraph x={144} y={150} />
        </>
      );
    },
  },
  {
    id: 'deploying',
    label: 'Deploying',
    description: 'Riding the rocket to prod — flames lit, fingers crossed.',
    focus: { x: 96, y: 20, w: 150, h: 172 },
    render() {
      return (
        <>
          <SceneBackdrop from="#EEF2FF" id="scene-deploy" to="#DDE4FF" />
          <Star cx={58} cy={40} r={2.2} />
          <Star cx={264} cy={54} r={2.8} />
          <Star cx={230} cy={30} r={1.8} />
          <g className="claude-scene__launch">
            <Rocket x={150} y={70} />
            <OctopusBody
              className="claude-scene__hero"
              expression="shocked"
              size={58}
              x={131}
              y={64}
            />
          </g>
          <g className="claude-scene__exhaust">
            <path d="M150 150 q10 26 20 0" fill="#F97316" />
            <path d="M155 150 q5 16 10 0" fill="#FBBF24" />
          </g>
          <SmokeCloud x={132} y={168} />
          <SmokeCloud x={188} y={172} />
          <SmokeCloud x={160} y={182} />
        </>
      );
    },
  },
  {
    id: 'hotfix',
    label: 'Hotfix',
    description: 'Prod is on fire — patch incoming with a flaming wrench.',
    focus: PORTRAIT_FOCUS,
    render() {
      return (
        <>
          <SceneBackdrop from="#FFF1EC" id="scene-hotfix" to="#FBD7C9" />
          <AlertTriangle cls="claude-scene__alert--a" x={70} y={54} />
          <AlertTriangle cls="claude-scene__alert--b" x={250} y={62} />
          <OctopusBody
            className="claude-scene__hero claude-scene__hero--shake"
            expression="focused"
            size={80}
            x={120}
            y={78}
          />
          <WrenchFlame x={214} y={150} />
        </>
      );
    },
  },
  {
    id: 'panicking',
    label: 'Panic',
    description: 'Prod is down and Slack is loud — sweating through the incident.',
    focus: PORTRAIT_FOCUS,
    render() {
      return (
        <>
          <SceneBackdrop from="#FFF0F0" id="scene-panic" to="#FBD2D2" />
          <AlertTriangle cls="claude-scene__alert--a" x={64} y={50} />
          <AlertTriangle cls="claude-scene__alert--b" x={200} y={40} />
          <AlertTriangle cls="claude-scene__alert--c" x={258} y={70} />
          <OctopusBody
            className="claude-scene__hero claude-scene__hero--shake"
            expression="shocked"
            size={82}
            x={124}
            y={78}
          />
          <SweatDrop cls="claude-scene__sweat--1" x={96} y={120} />
          <SweatDrop cls="claude-scene__sweat--2" x={224} y={126} />
        </>
      );
    },
  },
  {
    id: 'sad',
    label: 'Sad',
    description: 'Tests failed and scope crept — a little rain cloud overhead.',
    focus: PORTRAIT_FOCUS,
    render() {
      return (
        <>
          <SceneBackdrop from="#F2F5F8" id="scene-sad" to="#DFE5EC" />
          <RainCloud x={160} y={40} />
          <OctopusBody
            className="claude-scene__hero claude-scene__hero--slump"
            expression="sad"
            size={80}
            x={122}
            y={82}
          />
        </>
      );
    },
  },
];

// Reference shared inks so the palette stays centralized.
export const SCENE_TEXT_INK = SCENE_INK;
export const SCENE_TEXT_INK_SOFT = SCENE_INK_SOFT;

const SCENE_BY_ID = new Map<string, ClaudeOctopusSceneDef>(
  SCENES.map((scene) => [scene.id, scene]),
);

export type ClaudeOctopusSceneId = (typeof SCENES)[number]['id'];

export const CLAUDE_OCTOPUS_SCENES = SCENES;

export const CLAUDE_OCTOPUS_SCENE_IDS: readonly string[] = SCENES.map((scene) => scene.id);

export function claudeOctopusScene(id: string): ClaudeOctopusSceneDef | undefined {
  return SCENE_BY_ID.get(id);
}

export function sceneFocusOrFull(id: string): SceneFocus {
  return SCENE_BY_ID.get(id)?.focus ?? FULL_FOCUS;
}
