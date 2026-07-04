/**
 * Integer-grid pose kit — the SSOT geometry for the sharp Clawd rig.
 *
 * Every pose is DATA: whole-number `<rect>` blocks on the official 129×113 grid
 * (reused/extended from ayotomcs.me/claude-mascot) so edges land on exact device
 * pixels at any size, and motion is a hard frame-swap rather than CSS sub-pixel
 * interpolation.
 *
 * The full ~190-pose roster is COMPOSED, not hand-drawn: a small library of
 * pixel-art props + eight motion archetypes + a per-pose spec table generates a
 * rig entry for each pose. Seven flagship poses stay hand-authored below; the
 * rest are built from `SPECS`. Adding/adjusting a pose = editing one spec line.
 */
import { CLAUDE_CODE_BRAND_HEX, CLAUDE_CODE_OCTOPUS_EYE_INK } from './builderAssistantMarkPaths';

export const RIG_VIEWBOX = '0 0 129 113';

/** A single pixel block: [x, y, width, height] on the integer grid. */
export type RigRect = readonly [x: number, y: number, w: number, h: number];

/** A coloured prop block in absolute viewBox space (confetti, hearts, Zzz…). */
export interface RigAccent {
  readonly rect: RigRect;
  readonly fill: string;
  /** Optional CSS class for prop motion (float/rise/blink/spin/…). */
  readonly cls?: string;
}

/** One frame of the body: brand-hex blocks + eye-ink blocks, plus its offset. */
export interface RigFrame {
  readonly id: string;
  /** Per-frame translate — the squash/stretch/hop offset from the source rig. */
  readonly tx: number;
  readonly ty: number;
  readonly body: readonly RigRect[];
  readonly eyes: readonly RigRect[];
  /**
   * Per-frame coloured details (a held tool, a splat) that swap AND translate
   * with the frame — distinct from ambient `accents`, which loop on their own.
   * This is what lets an action pose choreograph a prop frame-by-frame.
   */
  readonly props?: readonly RigAccent[];
}

/** A named pose: one or more body frames (swapped) + optional prop accents. */
export interface RigPose {
  readonly frames: readonly RigFrame[];
  /** Full frame-swap loop in ms — required when `frames.length > 1`. */
  readonly loopMs?: number;
  /** Props in absolute viewBox space; animate via their own `cls`. */
  readonly accents?: readonly RigAccent[];
}

// --- Palette -----------------------------------------------------------------
const INK = CLAUDE_CODE_OCTOPUS_EYE_INK;
const BRAND = CLAUDE_CODE_BRAND_HEX;
const GOLD = '#E3A857';
const SKY = '#7CA4D0';
const CORAL = '#DD8361';
const PINK = '#C87392';
const GREEN = '#7FAE86';
const CREAM = '#EFE4D6';
const WHITE = '#F5EFE7';
const HEART = '#CB708F';
/** A bulb that hasn't lit yet — muted tan so the "pop" to GOLD reads as ignition. */
const DIM = '#A99C86';
const CONFETTI = ['#7CA4D0', '#DD8361', '#C87392', '#CB708F'] as const;

type ToneKey = 'gold' | 'sky' | 'coral' | 'pink' | 'green' | 'ink' | 'cream' | 'brand' | 'white';
const TONE: Record<ToneKey, string> = {
  gold: GOLD,
  sky: SKY,
  coral: CORAL,
  pink: PINK,
  green: GREEN,
  ink: INK,
  cream: CREAM,
  brand: BRAND,
  white: WHITE,
};

// --- Shared body parts (neutral standing pose, source frame l001) ------------
const TORSO: RigRect = [22, 0, 85, 65];
const LEGS: readonly RigRect[] = [
  [22, 65, 11, 12],
  [43, 65, 11, 12],
  [75, 65, 11, 12],
  [96, 65, 11, 12],
];
const HANDS: readonly RigRect[] = [
  [0, 36, 22, 23],
  [107, 36, 22, 23],
];
/** Neutral standing body: torso + four legs + two side hands. */
const STAND_BODY: readonly RigRect[] = [TORSO, ...LEGS, ...HANDS];

/** Eyes — 11×11 ink squares. Variants just move/shrink/reshape the ink rects. */
const EYES_OPEN: readonly RigRect[] = [
  [32, 25, 11, 11],
  [86, 25, 11, 11],
];
const EYES_UP: readonly RigRect[] = [
  [32, 23, 11, 11],
  [86, 23, 11, 11],
];
/** Closed lids — thin ink lines low in the socket. */
const EYES_CLOSED: readonly RigRect[] = [
  [32, 31, 11, 3],
  [86, 31, 11, 3],
];
/** Half-shut squint — a short bar mid-socket. */
const EYES_SQUINT: readonly RigRect[] = [
  [32, 29, 11, 4],
  [86, 29, 11, 4],
];
/** Heavy droopy lids — thick bar sitting low. */
const EYES_DROOPY: readonly RigRect[] = [
  [32, 30, 11, 6],
  [86, 30, 11, 6],
];
/** Wide startled eyes — oversized squares. */
const EYES_WIDE: readonly RigRect[] = [
  [30, 23, 15, 15],
  [84, 23, 15, 15],
];
/** Dead X eyes — two crossed diagonals per socket. */
const EYES_X: readonly RigRect[] = [
  [32, 25, 3, 3],
  [36, 29, 3, 3],
  [40, 33, 3, 3],
  [40, 25, 3, 3],
  [32, 33, 3, 3],
  [86, 25, 3, 3],
  [90, 29, 3, 3],
  [94, 33, 3, 3],
  [94, 25, 3, 3],
  [86, 33, 3, 3],
];

type EyeKind = 'open' | 'up' | 'closed' | 'squint' | 'droopy' | 'wide' | 'x' | 'none';
const EYE_SETS: Record<EyeKind, readonly RigRect[]> = {
  open: EYES_OPEN,
  up: EYES_UP,
  closed: EYES_CLOSED,
  squint: EYES_SQUINT,
  droopy: EYES_DROOPY,
  wide: EYES_WIDE,
  x: EYES_X,
  none: [],
};

/** A tiny pixel heart (two bumps + body + point) as prop accents. */
function heart(x: number, y: number, cls: string): readonly RigAccent[] {
  return [
    { rect: [x, y, 2, 2], fill: HEART, cls },
    { rect: [x + 3, y, 2, 2], fill: HEART, cls },
    { rect: [x, y + 2, 5, 2], fill: HEART, cls },
    { rect: [x + 1, y + 4, 3, 1], fill: HEART, cls },
  ];
}

// --- Motion archetypes -------------------------------------------------------
/**
 * Each archetype is a MULTI-FRAME body-deformation sequence (squash, stretch,
 * lean, arm-throw) — the same technique as the hand-authored jump, generalised
 * so every generated pose inherits real choreography, not a 2-frame nudge.
 */
type MotionKind = 'static' | 'hop' | 'bob' | 'float' | 'pulse' | 'rock' | 'sway' | 'jitter';

/** Shift each eye rect — keeps the eyes on the face as the torso deforms. */
function nudgeEyes(eyes: readonly RigRect[], dx: number, dy: number): readonly RigRect[] {
  return eyes.map((r): RigRect => [r[0] + dx, r[1] + dy, r[2], r[3]]);
}

/** One frame as [tx, ty, body, eyes]; frame ids are assigned by `build`. */
type FrameSpec = readonly [number, number, readonly RigRect[], readonly RigRect[]];
function build(
  specs: readonly FrameSpec[],
  loopMs?: number,
): { frames: readonly RigFrame[]; loopMs?: number } {
  const frames = specs.map(
    (s, i): RigFrame => ({ id: `k${i}`, tx: s[0], ty: s[1], body: s[2], eyes: s[3] }),
  );
  return loopMs === undefined ? { frames } : { frames, loopMs };
}

// Body deformations in local space (each frame is translated down by its ty).
const LEGS_SPLAY: readonly RigRect[] = [
  [18, 65, 11, 12],
  [40, 66, 11, 11],
  [76, 66, 11, 11],
  [100, 65, 11, 12],
];
/** Landing crouch — short, wide torso; splayed legs; arms braced low. */
const BODY_SQUASH: readonly RigRect[] = [
  [18, 9, 93, 56],
  ...LEGS_SPLAY,
  [0, 44, 22, 21],
  [107, 44, 22, 21],
];
/** Launch stretch — tall, narrow torso; arms sweeping upward. */
const BODY_STRETCH: readonly RigRect[] = [
  [27, -6, 75, 71],
  ...LEGS,
  [3, 24, 19, 24],
  [107, 24, 19, 24],
];
/** Peak — arms thrown fully overhead. */
const BODY_ARMSUP: readonly RigRect[] = [
  [25, -3, 79, 68],
  ...LEGS,
  [5, 2, 19, 26],
  [105, 2, 19, 26],
];
/** Lean left — torso split into two columns, left raised. */
const BODY_TILT_L: readonly RigRect[] = [
  [22, -1, 42, 66],
  [64, 3, 43, 62],
  ...LEGS,
  [0, 35, 22, 23],
  [107, 38, 22, 23],
];
/** Lean right — mirror of the left lean. */
const BODY_TILT_R: readonly RigRect[] = [
  [22, 3, 42, 62],
  [64, -1, 43, 66],
  ...LEGS,
  [0, 38, 22, 23],
  [107, 35, 22, 23],
];
/** Inhale — a touch taller/narrower. */
const BODY_INHALE: readonly RigRect[] = [
  [24, -2, 81, 67],
  ...LEGS,
  [0, 34, 22, 23],
  [107, 34, 22, 23],
];
/** Exhale — a touch shorter/wider. */
const BODY_EXHALE: readonly RigRect[] = [
  [20, 4, 89, 61],
  ...LEGS,
  [0, 39, 22, 21],
  [107, 39, 22, 21],
];
/** Working taps — arms offset opposite ways (alternate across frames). */
const BODY_TAP_A: readonly RigRect[] = [TORSO, ...LEGS, [0, 39, 22, 21], [107, 32, 22, 24]];
const BODY_TAP_B: readonly RigRect[] = [TORSO, ...LEGS, [0, 32, 22, 24], [107, 39, 22, 21]];
/** Drifting — arms eased slightly outward for a weightless float. */
const BODY_DRIFT: readonly RigRect[] = [TORSO, ...LEGS, [0, 33, 22, 23], [107, 33, 22, 23]];

function motionFrames(
  kind: MotionKind,
  eyes: readonly RigRect[],
): { frames: readonly RigFrame[]; loopMs?: number } {
  switch (kind) {
    // Excited leap — squash, launch with arms sweeping up, peak, land, settle.
    case 'hop':
      return build(
        [
          [0, 40, BODY_SQUASH, nudgeEyes(eyes, 0, 5)],
          [0, 29, BODY_STRETCH, nudgeEyes(eyes, 1, -3)],
          [0, 21, BODY_ARMSUP, nudgeEyes(eyes, 1, -2)],
          [0, 33, STAND_BODY, eyes],
          [0, 39, BODY_SQUASH, nudgeEyes(eyes, 0, 4)],
        ],
        840,
      );
    // Busy work — a low dip while the two arms tap alternately.
    case 'bob':
      return build(
        [
          [0, 36, BODY_TAP_A, eyes],
          [0, 34, STAND_BODY, eyes],
          [0, 36, BODY_TAP_B, eyes],
          [0, 34, STAND_BODY, eyes],
        ],
        520,
      );
    // Weightless drift — a slow rise and fall with arms easing outward.
    case 'float':
      return build(
        [
          [0, 36, STAND_BODY, eyes],
          [-1, 33, BODY_DRIFT, eyes],
          [0, 30, BODY_DRIFT, eyes],
          [1, 33, BODY_DRIFT, eyes],
        ],
        2400,
      );
    // Breathing — a gentle inhale-stretch then exhale-squash in place.
    case 'pulse':
      return build(
        [
          [0, 36, STAND_BODY, eyes],
          [0, 35, BODY_INHALE, nudgeEyes(eyes, 0, -1)],
          [0, 36, STAND_BODY, eyes],
          [0, 37, BODY_EXHALE, nudgeEyes(eyes, 0, 2)],
        ],
        1300,
      );
    // Weight shift — rock left, centre, right, centre with a matching tilt.
    case 'rock':
      return build(
        [
          [-3, 36, BODY_TILT_L, eyes],
          [0, 35, STAND_BODY, eyes],
          [3, 36, BODY_TILT_R, eyes],
          [0, 35, STAND_BODY, eyes],
        ],
        700,
      );
    // Slow sway — the same lean, wider and calmer.
    case 'sway':
      return build(
        [
          [-4, 36, BODY_TILT_L, eyes],
          [0, 35, STAND_BODY, eyes],
          [4, 36, BODY_TILT_R, eyes],
          [0, 35, STAND_BODY, eyes],
        ],
        1800,
      );
    // Nervous shiver — a fast jitter with a scared squash mid-shake.
    case 'jitter':
      return build(
        [
          [-2, 36, STAND_BODY, eyes],
          [2, 35, STAND_BODY, eyes],
          [-1, 37, BODY_EXHALE, nudgeEyes(eyes, 0, 1)],
          [2, 35, STAND_BODY, eyes],
          [-2, 36, STAND_BODY, eyes],
        ],
        360,
      );
    // Idle — a slow, barely-there breath so a resting pose still feels alive.
    default:
      return build(
        [
          [0, 36, STAND_BODY, eyes],
          [0, 35, BODY_INHALE, nudgeEyes(eyes, 0, -1)],
          [0, 36, STAND_BODY, eyes],
        ],
        2600,
      );
  }
}

// --- Prop library ------------------------------------------------------------
/** A prop cell: [x, y, w, h] (uses the spec tone) or [x, y, w, h, fill]. */
type Cell = readonly [number, number, number, number, string?];

/** Pixel-art motifs in a local box; placed at a corner (or absolute, for over-face). */
const PROP_CELLS: Record<string, readonly Cell[]> = {
  // sparkle / stars / light
  star: [
    [3, 0, 3, 3],
    [3, 6, 3, 3],
    [0, 3, 3, 3],
    [6, 3, 3, 3],
    [2, 2, 5, 5],
  ],
  sparkle: [
    [2, 0, 1, 5],
    [0, 2, 5, 1],
    [1, 1, 3, 3],
  ],
  bulb: [
    [1, 0, 5, 5],
    [2, 5, 3, 1],
    [2, 6, 3, 2, INK],
  ],
  // documents / text
  doc: [
    [0, 0, 8, 11],
    [1, 2, 6, 1, INK],
    [1, 4, 6, 1, INK],
    [1, 6, 6, 1, INK],
    [1, 8, 4, 1, INK],
  ],
  book: [
    [0, 0, 8, 8],
    [3, 0, 2, 8, INK],
    [1, 2, 2, 1, WHITE],
    [5, 2, 2, 1, WHITE],
  ],
  scroll: [
    [0, 0, 7, 1, CORAL],
    [0, 7, 7, 1, CORAL],
    [0, 1, 7, 6],
  ],
  bubble: [
    [0, 0, 8, 6],
    [1, 6, 2, 2],
    [2, 2, 4, 1, WHITE],
    [2, 4, 3, 1, WHITE],
  ],
  tag: [
    [0, 1, 5, 6],
    [5, 2, 2, 2],
    [1, 2, 1, 1, WHITE],
  ],
  // money / reward
  dollar: [
    [3, 0, 2, 11],
    [1, 1, 4, 2],
    [1, 4, 3, 2],
    [3, 6, 3, 2],
    [1, 8, 4, 2],
  ],
  crown: [
    [30, -4, 68, 4],
    [30, -9, 8, 5],
    [58, -11, 10, 6],
    [86, -9, 8, 5],
    [42, -3, 3, 3, PINK],
    [70, -3, 3, 3, PINK],
  ],
  // tools / code
  scope: [
    [0, 0, 6, 1],
    [0, 5, 6, 1],
    [0, 1, 1, 4],
    [5, 1, 1, 4],
    [6, 6, 3, 3],
  ],
  gear: [
    [1, 1, 6, 6],
    [3, 0, 2, 1],
    [3, 7, 2, 1],
    [0, 3, 1, 2],
    [7, 3, 1, 2],
    [3, 3, 2, 2, CREAM],
  ],
  wrench: [
    [0, 0, 3, 2],
    [0, 0, 2, 3],
    [2, 2, 3, 3],
    [5, 5, 3, 3],
  ],
  bolt: [
    [3, 0, 2, 4],
    [1, 4, 4, 2],
    [3, 4, 3, 2],
    [2, 6, 3, 4],
  ],
  chart: [
    [0, 6, 2, 4],
    [3, 3, 2, 7],
    [6, 0, 2, 10],
  ],
  branch: [
    [1, 1, 2, 8],
    [3, 3, 3, 1],
    [5, 1, 2, 2],
    [5, 5, 2, 2],
  ],
  fork: [
    [0, 0, 1, 4],
    [2, 0, 1, 4],
    [4, 0, 1, 4],
    [0, 4, 5, 1],
    [2, 5, 1, 4],
  ],
  check: [
    [0, 4, 2, 2],
    [2, 6, 2, 2],
    [4, 4, 2, 2],
    [6, 2, 2, 2],
    [8, 0, 2, 2],
  ],
  cursor: [[0, 0, 3, 11]],
  // emotes / faces / props
  flame: [
    [2, 1, 4, 8],
    [3, 0, 2, 2],
    [1, 6, 6, 2],
    [3, 3, 2, 4, GOLD],
  ],
  note: [
    [0, 5, 3, 3],
    [2, 0, 1, 8],
    [2, 0, 3, 2],
  ],
  mug: [
    [0, 1, 5, 6],
    [5, 2, 2, 3],
    [0, 0, 5, 1, WHITE],
    [1, -2, 1, 2, WHITE],
    [3, -3, 1, 3, WHITE],
  ],
  mic: [
    [2, 0, 4, 5, CORAL],
    [3, 5, 2, 3],
    [1, 8, 6, 1],
  ],
  duck: [
    [1, 2, 4, 3],
    [3, 0, 3, 3],
    [6, 1, 2, 1, CORAL],
    [4, 1, 1, 1, INK],
    [0, 3, 1, 1],
  ],
  pad: [
    [0, 1, 8, 4],
    [1, 2, 1, 2, CREAM],
    [0, 3, 3, 1, CREAM],
    [6, 2, 1, 1, CORAL],
    [6, 4, 1, 1, GREEN],
  ],
  megaphone: [
    [0, 2, 2, 4],
    [2, 1, 3, 6],
    [5, 0, 2, 8],
    [8, 2, 1, 1],
    [8, 5, 1, 1],
  ],
  moon: [
    [2, 0, 4, 1],
    [1, 1, 2, 1],
    [0, 2, 2, 4],
    [1, 6, 2, 1],
    [2, 7, 4, 1],
  ],
  ghost: [
    [0, 0, 8, 7],
    [0, 7, 2, 2],
    [3, 7, 2, 2],
    [6, 7, 2, 2],
    [2, 2, 1, 2, INK],
    [5, 2, 1, 2, INK],
  ],
  muscle: [
    [0, 0, 3, 3],
    [0, 3, 3, 3],
    [3, 1, 4, 4],
    [3, 4, 3, 3],
  ],
  rewind: [
    [3, 1, 1, 1],
    [2, 2, 1, 1],
    [1, 3, 2, 1],
    [2, 4, 1, 1],
    [3, 5, 1, 1],
    [7, 1, 1, 1],
    [6, 2, 1, 1],
    [5, 3, 2, 1],
    [6, 4, 1, 1],
    [7, 5, 1, 1],
  ],
  rocket: [
    [3, 0, 2, 3],
    [2, 3, 4, 5],
    [1, 7, 2, 2],
    [5, 7, 2, 2],
    [3, 4, 2, 2, SKY],
    [3, 9, 2, 3, CORAL],
  ],
  clock: [
    [1, 1, 6, 6, CREAM],
    [1, 0, 6, 1],
    [0, 1, 1, 6],
    [7, 1, 1, 6],
    [1, 7, 6, 1],
    [3, 2, 1, 3, INK],
    [4, 4, 3, 1, INK],
  ],
  sweat: [
    [1, 0, 1, 2],
    [0, 2, 3, 3],
  ],
  radar: [
    [0, 6, 7, 1],
    [3, 1, 1, 5],
    [3, 3, 3, 3],
  ],
  siren: [
    [1, 0, 4, 3],
    [0, 3, 6, 2],
    [2, -2, 2, 2, GOLD],
  ],
  phone: [
    [0, 0, 5, 8],
    [1, 1, 3, 5, SKY],
    [1, 6, 3, 1, WHITE],
  ],
  cherry: [
    [1, 5, 2, 2],
    [4, 5, 2, 2],
    [2, 0, 1, 5, GREEN],
    [4, 0, 1, 5, GREEN],
  ],
  box: [
    [0, 2, 8, 6],
    [0, 1, 8, 1],
    [3, 1, 2, 7, CORAL],
  ],
  dna: [
    [0, 0, 2, 2],
    [5, 0, 2, 2],
    [2, 2, 3, 1],
    [0, 4, 2, 2],
    [5, 4, 2, 2],
    [2, 3, 3, 1],
  ],
  tube: [
    [2, 0, 3, 2, CREAM],
    [2, 2, 3, 7],
    [2, 6, 3, 3, GREEN],
    [1, 9, 5, 1],
  ],
  dice: [
    [0, 0, 8, 8],
    [1, 1, 2, 2, INK],
    [5, 5, 2, 2, INK],
    [5, 1, 2, 2, INK],
    [1, 5, 2, 2, INK],
  ],
  mask: [
    [0, 1, 3, 4],
    [4, 1, 3, 4],
    [1, 2, 1, 1, WHITE],
    [5, 2, 1, 1, WHITE],
  ],
  sprout: [
    [3, 3, 1, 6, GREEN],
    [1, 2, 3, 2, GREEN],
    [4, 2, 3, 2, GREEN],
  ],
  truck: [
    [0, 2, 6, 4],
    [6, 3, 3, 3],
    [1, 6, 2, 2, INK],
    [6, 6, 2, 2, INK],
  ],
  bird: [
    [1, 1, 4, 3],
    [4, 0, 2, 2],
    [2, 2, 2, 1, WHITE],
    [6, 1, 1, 1, CORAL],
    [5, 1, 1, 1, INK],
  ],
  flag: [
    [0, 0, 1, 10, INK],
    [1, 0, 6, 4],
  ],
  split: [
    [0, 0, 3, 7],
    [4, 0, 3, 7, CORAL],
  ],
  funnel: [
    [0, 0, 8, 2],
    [1, 2, 6, 2],
    [3, 4, 2, 3],
    [4, 7, 1, 2, SKY],
  ],
  spiral: [
    [1, 0, 5, 1],
    [0, 1, 1, 4],
    [5, 1, 1, 2],
    [2, 2, 3, 1],
    [2, 4, 2, 1],
    [4, 3, 1, 2],
  ],
  backpack: [
    [1, 1, 6, 7],
    [1, 1, 6, 3, CORAL],
    [3, 0, 2, 2],
    [3, 5, 2, 2, INK],
  ],
  wave: [
    [0, 2, 2, 2],
    [2, 0, 2, 2],
    [4, 2, 2, 2],
    [6, 0, 2, 2],
    [8, 2, 2, 2],
  ],
  handshake: [
    [0, 2, 4, 2],
    [4, 3, 4, 2],
    [3, 2, 2, 3],
  ],
  crystal: [
    [2, 0, 3, 2],
    [1, 2, 5, 4],
    [2, 6, 3, 2],
    [3, 1, 1, 4, WHITE],
  ],
  pen: [
    [0, 8, 2, 2, GOLD],
    [1, 6, 2, 2],
    [2, 4, 2, 2],
    [3, 2, 2, 2],
    [4, 0, 2, 2],
  ],
  people: [
    [0, 0, 3, 3],
    [0, 3, 3, 4],
    [4, 0, 3, 3],
    [4, 3, 3, 4],
  ],
  person: [
    [1, 0, 3, 3],
    [1, 3, 3, 5],
  ],
  lock: [
    [1, 0, 4, 1],
    [1, 1, 1, 2],
    [4, 1, 1, 2],
    [0, 3, 7, 6],
    [3, 5, 1, 2, CREAM],
  ],
  shield: [
    [0, 0, 7, 2],
    [0, 2, 7, 3],
    [1, 5, 5, 2],
    [2, 7, 3, 1],
    [3, 1, 1, 5, WHITE],
    [1, 3, 5, 1, WHITE],
  ],
  hook: [
    [3, 0, 1, 5],
    [1, 5, 3, 1],
    [1, 4, 1, 2],
    [1, 3, 1, 1],
  ],
  loop: [
    [1, 0, 5, 1],
    [0, 1, 1, 3],
    [5, 1, 1, 3],
    [1, 4, 5, 1],
    [5, 0, 2, 1],
    [0, 4, 2, 1],
  ],
  bell: [
    [3, 0, 2, 1],
    [1, 1, 6, 4],
    [0, 5, 8, 1],
    [3, 6, 2, 1],
  ],
  plug: [
    [0, 2, 4, 5],
    [4, 3, 2, 1, INK],
    [4, 5, 2, 1, INK],
  ],
  chain: [
    [0, 0, 3, 3],
    [2, 2, 3, 3],
    [4, 4, 3, 3],
    [1, 1, 1, 1, WHITE],
    [5, 5, 1, 1, WHITE],
  ],
  cloud: [
    [2, 1, 5, 2],
    [1, 2, 7, 3],
    [3, 0, 3, 2],
  ],
  home: [
    [0, 3, 8, 2, CORAL],
    [1, 5, 6, 4, CREAM],
    [3, 6, 2, 3, BRAND],
  ],
  hourglass: [
    [0, 0, 7, 1],
    [0, 8, 7, 1],
    [1, 1, 5, 2, GOLD],
    [2, 3, 3, 1, GOLD],
    [3, 5, 1, 1, GOLD],
    [1, 6, 5, 2, GOLD],
  ],
  barrier: [
    [0, 2, 10, 3],
    [1, 0, 2, 7, INK],
    [7, 0, 2, 7, INK],
    [3, 2, 2, 3, INK],
  ],
  download: [
    [3, 0, 2, 4],
    [2, 4, 4, 2],
    [3, 6, 2, 1],
    [0, 8, 7, 1],
  ],
  snow: [
    [3, 0, 1, 8],
    [0, 3, 8, 1],
    [1, 1, 1, 1],
    [6, 1, 1, 1],
    [1, 6, 1, 1],
    [6, 6, 1, 1],
    [3, 3, 2, 2],
  ],
  whale: [
    [1, 2, 6, 3],
    [0, 3, 2, 2],
    [7, 1, 2, 2],
    [2, 0, 1, 2, WHITE],
    [2, 3, 1, 1, INK],
  ],
  factory: [
    [0, 3, 8, 5],
    [1, 1, 1, 2],
    [3, 0, 2, 3],
    [3, -2, 2, 2, CREAM],
  ],
  brain: [
    [1, 0, 5, 1],
    [0, 1, 7, 4],
    [1, 5, 5, 1],
    [3, 1, 1, 4, WHITE],
  ],
  robot: [
    [1, 0, 6, 5],
    [3, -2, 1, 2],
    [2, 1, 1, 2, CREAM],
    [4, 1, 1, 2, CREAM],
    [2, 3, 3, 1, INK],
    [3, 5, 2, 1],
  ],
  gift: [
    [0, 3, 8, 6],
    [0, 1, 8, 2],
    [3, 1, 2, 8, PINK],
    [2, 0, 2, 2, PINK],
    [5, 0, 2, 2, PINK],
  ],
  syringe: [
    [1, 4, 5, 3, CREAM],
    [0, 3, 1, 5],
    [6, 5, 1, 1],
    [7, 5, 3, 1],
    [1, 5, 2, 1, CORAL],
  ],
  octo: [
    [1, 0, 5, 4],
    [2, 1, 1, 2, INK],
    [4, 1, 1, 2, INK],
    [0, 4, 1, 2],
    [2, 4, 1, 2],
    [4, 4, 1, 2],
    [6, 4, 1, 2],
  ],
  skull: [
    [0, 0, 7, 5],
    [1, 2, 2, 2, INK],
    [4, 2, 2, 2, INK],
    [1, 5, 5, 1],
    [2, 5, 1, 2, INK],
    [4, 5, 1, 2, INK],
  ],
  globe: [
    [1, 0, 5, 1],
    [0, 1, 7, 5],
    [1, 6, 5, 1],
    [3, 0, 1, 7, GREEN],
    [0, 3, 7, 1, GREEN],
  ],
  puzzle: [
    [0, 0, 5, 5],
    [5, 1, 2, 2],
    [2, 5, 2, 2],
  ],
  scale: [
    [3, 0, 2, 7],
    [0, 2, 8, 1],
    [0, 3, 2, 1],
    [6, 3, 2, 1],
    [1, 7, 6, 1],
  ],
  windows: [
    [0, 4, 5, 4],
    [0, 4, 5, 1, INK],
    [3, 2, 5, 4],
    [3, 2, 5, 1, INK],
    [6, 0, 5, 4],
    [6, 0, 5, 1, INK],
  ],
  zsmall: [
    [0, 0, 5, 1],
    [3, 1, 1, 1],
    [2, 2, 1, 1],
    [1, 3, 1, 1],
    [0, 4, 5, 1],
  ],
  // over-face props — absolute viewBox coords (anchor ignored)
  shades: [
    [30, 25, 14, 7, INK],
    [85, 25, 14, 7, INK],
    [44, 27, 41, 2, INK],
  ],
  halo: [
    [40, -6, 49, 3, GOLD],
    [38, -3, 4, 2, GOLD],
    [87, -3, 4, 2, GOLD],
  ],
  cap: [
    [30, -4, 58, 5],
    [22, 1, 16, 3],
  ],
  tears: [
    [34, 37, 3, 5],
    [36, 44, 3, 4],
    [88, 37, 3, 5],
    [90, 44, 3, 4],
  ],
  palm: [
    [28, 16, 44, 26, '#BE5C3A'],
    [32, 13, 7, 5, '#BE5C3A'],
    [41, 12, 7, 6, '#BE5C3A'],
    [50, 12, 7, 6, '#BE5C3A'],
    [59, 13, 7, 5, '#BE5C3A'],
    [39, 14, 1, 26, '#8F3D24'],
    [48, 13, 1, 27, '#8F3D24'],
    [57, 14, 1, 26, '#8F3D24'],
  ],
  crack: [
    [60, 4, 3, 7, INK],
    [57, 11, 3, 7, INK],
    [61, 18, 3, 7, INK],
    [56, 25, 4, 8, INK],
  ],
};

// Aliases — reuse a built motif for a near-synonym glyph.
const PROP_ALIAS: Record<string, string> = { signal: 'chart', wheel: 'gear' };

/**
 * Over-face props read in body-local space. The body renders translated down by
 * the source frame's rest offset, so these shift by the same amount to land on
 * the eyes/head instead of floating above the creature.
 */
const OVER_PROPS: ReadonlySet<string> = new Set([
  'shades',
  'halo',
  'crown',
  'cap',
  'tears',
  'palm',
  'crack',
]);
const BODY_REST_TY = 36;

/** A prop placement: origin + integer scale (kept whole so edges stay crisp). */
interface Place {
  readonly ox: number;
  readonly oy: number;
  readonly s: number;
}
/** Single corner prop — scaled up, floating just above the head's right side. */
const SINGLE_PLACE: Place = { ox: 100, oy: 10, s: 2 };
/** Cluster (many) — unscaled emblems near the head-right, like the loving hearts. */
const MANY_A: Place = { ox: 92, oy: 4, s: 1 };
const MANY_B: Place = { ox: 108, oy: 2, s: 1 };
const MANY_C: Place = { ox: 100, oy: 18, s: 1 };

/** Per-prop fallback tone when a spec omits `t`. */
const PROP_TONE: Record<string, ToneKey> = {
  doc: 'cream',
  book: 'sky',
  scroll: 'cream',
  bubble: 'sky',
  clock: 'ink',
  dice: 'cream',
  tube: 'cream',
  home: 'cream',
  skull: 'cream',
  ghost: 'white',
  rocket: 'cream',
  robot: 'sky',
  phone: 'ink',
  mic: 'ink',
  pad: 'ink',
  crown: 'gold',
  halo: 'gold',
  shades: 'ink',
  cap: 'sky',
  tears: 'sky',
  palm: 'brand',
  crack: 'ink',
  hourglass: 'sky',
  barrier: 'gold',
};

type PMKind = 'float' | 'rise' | 'blink' | 'spin' | 'twinkle' | 'shake' | 'swing' | 'drop' | 'pop';
const PM_CLASS: Record<PMKind, string> = {
  float: 'octo-rig__accent--float',
  rise: 'octo-rig__accent--rise',
  blink: 'octo-rig__accent--blink',
  spin: 'octo-rig__accent--spin',
  twinkle: 'octo-rig__accent--twinkle',
  shake: 'octo-rig__accent--shake',
  swing: 'octo-rig__accent--swing',
  drop: 'octo-rig__accent--drop',
  pop: 'octo-rig__accent--pop',
};

function withDelay(base: string | undefined, suffix: string): string | undefined {
  return base ? `${base} octo-rig__accent${suffix}` : undefined;
}

function assemble(
  cells: readonly Cell[],
  place: Place,
  cls: string | undefined,
  tone: string,
): RigAccent[] {
  const { ox, oy, s } = place;
  return cells.map((c) => {
    const rect: RigRect = [ox + c[0] * s, oy + c[1] * s, c[2] * s, c[3] * s];
    const fill = c[4] ?? tone;
    return cls ? { rect, fill, cls } : { rect, fill };
  });
}

function placeProp(prop: string, pm: PMKind | undefined, tone: string, many: boolean): RigAccent[] {
  const key = PROP_ALIAS[prop] ?? prop;
  const cells: readonly Cell[] = PROP_CELLS[key] ?? PROP_CELLS.sparkle ?? [];
  const base = pm ? PM_CLASS[pm] : undefined;
  if (OVER_PROPS.has(key)) {
    return assemble(cells, { ox: 0, oy: BODY_REST_TY, s: 1 }, base, tone);
  }
  if (many) {
    return [
      ...assemble(cells, MANY_A, base, tone),
      ...assemble(cells, MANY_B, withDelay(base, '--delay1'), tone),
      ...assemble(cells, MANY_C, withDelay(base, '--delay2'), tone),
    ];
  }
  return assemble(cells, SINGLE_PLACE, base, tone);
}

// --- Pose specs --------------------------------------------------------------
interface Spec {
  /** Body motion archetype. */
  readonly m: MotionKind;
  /** Eye state. */
  readonly e: EyeKind;
  /** Prop motif id (see PROP_CELLS). */
  readonly p?: string;
  /** Prop motion class. */
  readonly pm?: PMKind;
  /** Prop tone override. */
  readonly t?: ToneKey;
  /** Repeat the prop three times, staggered (floating hearts/stars/confetti feel). */
  readonly many?: boolean;
}

/**
 * Every non-flagship pose as one spec line. The prop + motion + eyes + glow
 * (glow rides the shell span, so it is handled by `BuilderAssistantMark`)
 * give each a distinct read; identical glyphs share a motif by design.
 */
const SPECS: Record<string, Spec> = {
  // --- core poses (the seven flagships live in HAND_POSES) ---
  prompting: { m: 'static', e: 'open', p: 'cursor', pm: 'blink', t: 'ink' },
  manifesting: { m: 'static', e: 'closed', p: 'star', pm: 'rise', t: 'gold', many: true },
  summoning: { m: 'pulse', e: 'open', p: 'sparkle', pm: 'spin', t: 'gold', many: true },
  reviewing: { m: 'static', e: 'squint', p: 'scope', pm: 'swing', t: 'sky' },
  merging: { m: 'rock', e: 'open', p: 'branch', t: 'green' },
  micdrop: { m: 'hop', e: 'open', p: 'mic', pm: 'drop', t: 'ink' },
  rich: { m: 'float', e: 'open', p: 'dollar', pm: 'float', t: 'gold', many: true },
  dancing: { m: 'rock', e: 'open', p: 'note', pm: 'swing', t: 'sky', many: true },
  singing: { m: 'bob', e: 'open', p: 'note', pm: 'float', t: 'pink', many: true },
  vibing: { m: 'static', e: 'open', p: 'shades', t: 'ink' },
  coffee: { m: 'rock', e: 'open', p: 'mug', t: 'brand' },
  snacking: { m: 'bob', e: 'open', p: 'sparkle', pm: 'blink', t: 'coral' },
  typing: { m: 'bob', e: 'open', p: 'cursor', pm: 'blink', t: 'ink' },
  scrolling: { m: 'static', e: 'squint', p: 'bubble', t: 'sky' },
  rubberduck: { m: 'static', e: 'open', p: 'duck', t: 'gold' },
  gaming: { m: 'rock', e: 'open', p: 'pad', t: 'ink' },
  streaking: { m: 'static', e: 'open', p: 'flame', pm: 'twinkle', t: 'coral' },
  hoarding: { m: 'static', e: 'open', p: 'windows', t: 'sky' },
  preaching: { m: 'static', e: 'open', p: 'megaphone', pm: 'swing', t: 'coral' },
  nesting: { m: 'static', e: 'open', p: 'moon', t: 'sky' },
  ghosting: { m: 'float', e: 'open', p: 'ghost', t: 'white' },
  flexing: { m: 'hop', e: 'open', p: 'muscle', t: 'brand' },
  rewinding: { m: 'jitter', e: 'open', p: 'rewind', pm: 'spin', t: 'sky' },
  hotfix: { m: 'jitter', e: 'open', p: 'flame', pm: 'twinkle', t: 'coral' },
  waiting: { m: 'static', e: 'open', p: 'clock', t: 'ink' },
  panicking: { m: 'jitter', e: 'wide', p: 'sweat', pm: 'drop', t: 'sky' },
  broke: { m: 'static', e: 'x', p: 'crack', t: 'ink' },
  unhinged: { m: 'jitter', e: 'wide', p: 'sparkle', pm: 'spin', t: 'gold', many: true },
  facepalm: { m: 'static', e: 'closed', p: 'palm', t: 'brand' },
  tired: { m: 'static', e: 'droopy', p: 'zsmall', pm: 'rise', t: 'ink' },
  sad: { m: 'static', e: 'droopy', p: 'tears', pm: 'drop', t: 'sky' },

  // --- extended batch 1 ---
  brainstorming: { m: 'hop', e: 'open', p: 'bulb', pm: 'pop', t: 'gold' },
  whiteboarding: { m: 'static', e: 'open', p: 'doc', t: 'cream' },
  pairing: { m: 'static', e: 'open', p: 'people', t: 'sky' },
  mobbing: { m: 'pulse', e: 'open', p: 'people', t: 'coral' },
  refactoring: { m: 'rock', e: 'open', p: 'wrench', pm: 'swing', t: 'ink' },
  optimizing: { m: 'jitter', e: 'open', p: 'bolt', pm: 'twinkle', t: 'gold' },
  benchmarking: { m: 'float', e: 'open', p: 'chart', t: 'sky' },
  profiling: { m: 'static', e: 'squint', p: 'scope', pm: 'swing', t: 'ink' },
  logging: { m: 'bob', e: 'open', p: 'doc', t: 'cream' },
  monitoring: { m: 'pulse', e: 'open', p: 'radar', pm: 'spin', t: 'green' },
  alerting: { m: 'jitter', e: 'open', p: 'siren', pm: 'twinkle', t: 'coral' },
  oncall: { m: 'rock', e: 'open', p: 'phone', pm: 'swing', t: 'ink' },
  paging: { m: 'jitter', e: 'open', p: 'phone', pm: 'shake', t: 'ink' },
  incident: { m: 'jitter', e: 'open', p: 'siren', pm: 'twinkle', t: 'coral' },
  postmortem: { m: 'sway', e: 'open', p: 'doc', t: 'cream' },
  documenting: { m: 'float', e: 'open', p: 'book', t: 'sky' },
  readme: { m: 'bob', e: 'open', p: 'book', t: 'green' },
  changelog: { m: 'sway', e: 'open', p: 'scroll', t: 'cream' },
  versioning: { m: 'pulse', e: 'open', p: 'tag', t: 'sky' },
  tagging: { m: 'static', e: 'open', p: 'tag', pm: 'swing', t: 'coral' },
  rebasing: { m: 'rock', e: 'open', p: 'branch', t: 'green' },
  cherrypicking: { m: 'hop', e: 'open', p: 'cherry', t: 'pink' },
  stashing: { m: 'sway', e: 'open', p: 'box', t: 'brand' },
  cloning: { m: 'pulse', e: 'open', p: 'dna', pm: 'spin', t: 'sky' },
  forking: { m: 'static', e: 'open', p: 'fork', t: 'ink' },
  starring: { m: 'float', e: 'open', p: 'star', pm: 'twinkle', t: 'gold' },
  linting: { m: 'jitter', e: 'open', p: 'sparkle', pm: 'twinkle', t: 'gold' },
  formatting: { m: 'hop', e: 'open', p: 'check', pm: 'pop', t: 'green' },
  testing: { m: 'rock', e: 'open', p: 'tube', t: 'cream' },
  fuzzing: { m: 'jitter', e: 'open', p: 'dice', pm: 'spin', t: 'cream' },
  mocking: { m: 'pulse', e: 'open', p: 'mask', t: 'pink' },
  seeding: { m: 'float', e: 'open', p: 'sprout', t: 'green' },
  migrating: { m: 'sway', e: 'open', p: 'truck', t: 'sky' },
  rollback: { m: 'jitter', e: 'open', p: 'rewind', pm: 'spin', t: 'coral' },
  canarying: { m: 'hop', e: 'open', p: 'bird', t: 'gold' },
  bluegreen: { m: 'pulse', e: 'open', p: 'check', t: 'green' },
  flagging: { m: 'rock', e: 'open', p: 'flag', pm: 'swing', t: 'coral' },
  darkmode: { m: 'float', e: 'open', p: 'moon', t: 'sky' },
  abtesting: { m: 'jitter', e: 'open', p: 'split', t: 'sky' },
  analytics: { m: 'float', e: 'open', p: 'chart', t: 'green' },
  funneling: { m: 'static', e: 'open', p: 'funnel', pm: 'drop', t: 'sky' },
  churning: { m: 'jitter', e: 'droopy', p: 'spiral', pm: 'spin', t: 'sky' },
  onboarding: { m: 'hop', e: 'open', p: 'backpack', t: 'coral' },
  offboarding: { m: 'sway', e: 'open', p: 'wave', pm: 'swing', t: 'sky' },
  retiring: { m: 'float', e: 'open', p: 'moon', t: 'gold' },
  interviewing: { m: 'static', e: 'open', p: 'mic', t: 'ink' },
  hiring: { m: 'pulse', e: 'open', p: 'handshake', t: 'green' },
  standup: { m: 'static', e: 'open', p: 'person', t: 'sky' },
  retro: { m: 'sway', e: 'open', p: 'crystal', t: 'pink' },
  slacking: { m: 'bob', e: 'open', p: 'bubble', t: 'sky' },

  // --- extended batch 2 ---
  sketching: { m: 'sway', e: 'open', p: 'pen', pm: 'swing', t: 'ink' },
  wireframing: { m: 'static', e: 'open', p: 'doc', t: 'sky' },
  prototyping: { m: 'hop', e: 'open', p: 'tube', t: 'coral' },
  pitching: { m: 'rock', e: 'open', p: 'megaphone', pm: 'swing', t: 'coral' },
  demoing: { m: 'pulse', e: 'open', p: 'star', pm: 'twinkle', t: 'gold' },
  fundraising: { m: 'float', e: 'open', p: 'dollar', pm: 'float', t: 'gold', many: true },
  bootstrapping: { m: 'hop', e: 'open', p: 'box', t: 'ink' },
  freelancing: { m: 'sway', e: 'open', p: 'box', t: 'brand' },
  mentoring: { m: 'pulse', e: 'open', p: 'book', t: 'ink' },
  teaching: { m: 'bob', e: 'open', p: 'doc', t: 'green' },
  learning: { m: 'float', e: 'open', p: 'book', t: 'sky' },
  certifying: { m: 'pulse', e: 'open', p: 'scroll', t: 'gold' },
  securing: { m: 'jitter', e: 'open', p: 'lock', t: 'ink' },
  auditing: { m: 'static', e: 'squint', p: 'scope', pm: 'swing', t: 'ink' },
  patching: { m: 'hop', e: 'open', p: 'check', t: 'coral' },
  hardening: { m: 'pulse', e: 'open', p: 'shield', t: 'sky' },
  caching: { m: 'float', e: 'open', p: 'box', t: 'ink' },
  scaling: { m: 'pulse', e: 'open', p: 'chart', t: 'green' },
  sharding: { m: 'rock', e: 'open', p: 'puzzle', t: 'sky' },
  balancing: { m: 'sway', e: 'open', p: 'scale', pm: 'swing', t: 'gold' },
  throttling: { m: 'static', e: 'open', p: 'clock', t: 'ink' },
  queueing: { m: 'bob', e: 'open', p: 'doc', t: 'cream' },
  streaming: { m: 'float', e: 'open', p: 'wave', t: 'sky' },
  webhooks: { m: 'jitter', e: 'open', p: 'hook', pm: 'swing', t: 'ink' },
  polling: { m: 'jitter', e: 'open', p: 'loop', pm: 'spin', t: 'sky' },
  subscribing: { m: 'pulse', e: 'open', p: 'bell', pm: 'swing', t: 'gold' },
  publishing: { m: 'rock', e: 'open', p: 'megaphone', pm: 'swing', t: 'coral' },
  graphql: { m: 'static', e: 'open', p: 'chain', t: 'pink' },
  grpcing: { m: 'jitter', e: 'open', p: 'bolt', pm: 'twinkle', t: 'gold' },
  socketing: { m: 'rock', e: 'open', p: 'plug', pm: 'swing', t: 'sky' },
  cronning: { m: 'pulse', e: 'open', p: 'clock', t: 'ink' },
  scheduling: { m: 'sway', e: 'open', p: 'doc', t: 'sky' },
  backingup: { m: 'bob', e: 'open', p: 'box', t: 'ink' },
  restoring: { m: 'float', e: 'open', p: 'loop', pm: 'spin', t: 'green' },
  archiving: { m: 'sway', e: 'open', p: 'box', t: 'ink' },
  parsing: { m: 'static', e: 'open', p: 'doc', t: 'cream' },
  validating: { m: 'hop', e: 'open', p: 'check', pm: 'pop', t: 'green' },
  sanitizing: { m: 'jitter', e: 'open', p: 'sparkle', pm: 'twinkle', t: 'sky' },
  opensourcing: { m: 'pulse', e: 'open', p: 'globe', pm: 'spin', t: 'green' },
  contributing: { m: 'hop', e: 'open', p: 'check', pm: 'pop', t: 'green' },
  triaging: { m: 'rock', e: 'open', p: 'tag', pm: 'swing', t: 'coral' },
  prioritizing: { m: 'static', e: 'open', p: 'chart', t: 'coral' },
  estimating: { m: 'sway', e: 'open', p: 'doc', t: 'ink' },
  sprinting: { m: 'bob', e: 'open', p: 'flag', pm: 'swing', t: 'coral' },
  planning: { m: 'float', e: 'open', p: 'doc', t: 'sky' },
  grooming: { m: 'sway', e: 'open', p: 'check', t: 'ink' },
  speccing: { m: 'static', e: 'open', p: 'doc', t: 'cream' },
  scoping: { m: 'static', e: 'open', p: 'scope', t: 'coral' },
  descoping: { m: 'sway', e: 'open', p: 'check', t: 'ink' },
  yoloing: { m: 'jitter', e: 'open', p: 'sparkle', pm: 'spin', t: 'gold' },
  freezing: { m: 'static', e: 'open', p: 'snow', t: 'sky' },
  complying: { m: 'pulse', e: 'open', p: 'scale', t: 'ink' },
  licensing: { m: 'sway', e: 'open', p: 'doc', t: 'cream' },
  installing: { m: 'bob', e: 'open', p: 'download', pm: 'drop', t: 'sky' },
  dockerizing: { m: 'rock', e: 'open', p: 'whale', t: 'sky' },
  kubernetes: { m: 'jitter', e: 'open', p: 'wheel', pm: 'spin', t: 'sky' },
  terraform: { m: 'static', e: 'open', p: 'box', t: 'coral' },
  infra: { m: 'pulse', e: 'open', p: 'factory', t: 'ink' },
  serverless: { m: 'float', e: 'open', p: 'cloud', t: 'sky' },
  edge: { m: 'jitter', e: 'open', p: 'signal', pm: 'twinkle', t: 'sky' },
  multicloud: { m: 'sway', e: 'open', p: 'globe', pm: 'spin', t: 'sky' },
  localdev: { m: 'bob', e: 'open', p: 'home', t: 'cream' },
  remote: { m: 'float', e: 'open', p: 'home', t: 'sky' },
  hybrid: { m: 'rock', e: 'open', p: 'loop', pm: 'spin', t: 'sky' },
  async: { m: 'pulse', e: 'open', p: 'hourglass', t: 'sky' },
  awaiting: { m: 'static', e: 'open', p: 'hourglass', t: 'sky' },
  blocking: { m: 'jitter', e: 'open', p: 'barrier', pm: 'shake', t: 'gold' },
  deadlocked: { m: 'jitter', e: 'open', p: 'lock', pm: 'spin', t: 'coral' },
  racecondition: { m: 'jitter', e: 'open', p: 'bolt', pm: 'shake', t: 'coral' },
  memoryleak: { m: 'float', e: 'droopy', p: 'sweat', pm: 'drop', t: 'sky' },
  stackoverflowing: { m: 'bob', e: 'open', p: 'book', t: 'coral' },
  copypasting: { m: 'rock', e: 'open', p: 'doc', t: 'cream' },
  vibecommit: { m: 'pulse', e: 'open', p: 'sparkle', pm: 'twinkle', t: 'gold' },
  nocap: { m: 'static', e: 'open', p: 'cap', t: 'ink' },
  based: { m: 'static', e: 'open', p: 'crown', t: 'gold' },
  cooked: { m: 'jitter', e: 'open', p: 'flame', pm: 'twinkle', t: 'coral' },
  delulu: { m: 'float', e: 'open', p: 'star', pm: 'twinkle', t: 'pink', many: true },
  maincharacter: { m: 'sway', e: 'open', p: 'star', pm: 'twinkle', t: 'gold' },
  sidequest: { m: 'sway', e: 'open', p: 'doc', t: 'sky' },
  bossfight: { m: 'jitter', e: 'open', p: 'flame', pm: 'shake', t: 'coral' },
  leveling: { m: 'hop', e: 'open', p: 'signal', pm: 'pop', t: 'green' },
  grinding: { m: 'bob', e: 'open', p: 'gear', pm: 'spin', t: 'ink' },
  respawning: { m: 'jitter', e: 'open', p: 'sparkle', pm: 'spin', t: 'sky' },
  permadeath: { m: 'static', e: 'x', p: 'skull', t: 'cream' },
  speedrunning: { m: 'jitter', e: 'open', p: 'flag', pm: 'shake', t: 'coral' },
  minmaxing: { m: 'float', e: 'open', p: 'chart', t: 'sky' },
  theorycraft: { m: 'sway', e: 'open', p: 'brain', t: 'pink' },
  metagaming: { m: 'rock', e: 'open', p: 'dice', pm: 'spin', t: 'coral' },
  modding: { m: 'rock', e: 'open', p: 'wrench', pm: 'swing', t: 'ink' },
  plugin: { m: 'hop', e: 'open', p: 'plug', pm: 'pop', t: 'sky' },
  extending: { m: 'pulse', e: 'open', p: 'puzzle', t: 'green' },
  hooking: { m: 'jitter', e: 'open', p: 'hook', pm: 'swing', t: 'ink' },
  scripting: { m: 'float', e: 'open', p: 'scroll', t: 'green' },
  automating: { m: 'jitter', e: 'open', p: 'robot', pm: 'spin', t: 'sky' },
  workflow: { m: 'sway', e: 'open', p: 'chain', t: 'sky' },
  n8n: { m: 'pulse', e: 'open', p: 'loop', pm: 'spin', t: 'green' },
  zapier: { m: 'hop', e: 'open', p: 'bolt', pm: 'pop', t: 'gold' },
  aiwrapping: { m: 'rock', e: 'open', p: 'gift', t: 'pink' },
  promptinject: { m: 'static', e: 'open', p: 'syringe', pm: 'swing', t: 'coral' },
  agentswarm: { m: 'jitter', e: 'open', p: 'octo', pm: 'spin', t: 'brand' },
};

function toneOf(prop: string | undefined, t: ToneKey | undefined): string {
  if (t) {
    return TONE[t];
  }
  const key = prop ? (PROP_ALIAS[prop] ?? prop) : undefined;
  return key && PROP_TONE[key] ? TONE[PROP_TONE[key]] : GOLD;
}

function buildFromSpec(spec: Spec): RigPose {
  const eyes = EYE_SETS[spec.e];
  const motion = motionFrames(spec.m, eyes);
  const accents = spec.p
    ? placeProp(spec.p, spec.pm, toneOf(spec.p, spec.t), spec.many === true)
    : [];
  return {
    frames: motion.frames,
    ...(motion.loopMs === undefined ? {} : { loopMs: motion.loopMs }),
    ...(accents.length > 0 ? { accents } : {}),
  };
}

// --- Flagship hand-authored poses (kept exactly, zero regression) ------------
/**
 * Confetti jump — stand → crouch → launch → crouch → stand (source frames
 * l001–l005). The launch frame throws an arm up and splits the torso for the
 * leaning stretch.
 */
export const CONFETTI_JUMP: readonly RigFrame[] = [
  { id: 'l001', tx: 0, ty: 36, body: STAND_BODY, eyes: EYES_OPEN },
  {
    id: 'l002',
    tx: 2,
    ty: 3,
    body: [
      [22, 20, 42, 65],
      [64, 9, 43, 71],
      [43, 14, 32, 21],
      [22, 85, 11, 25],
      [43, 85, 11, 25],
      [75, 80, 11, 30],
      [96, 80, 11, 30],
      [0, 42, 22, 23],
      [103, 0, 22, 31],
    ],
    eyes: [
      [32, 31, 11, 11],
      [86, 20, 11, 11],
    ],
  },
  {
    id: 'l003',
    tx: 2,
    ty: -8,
    body: [
      [22, 23, 42, 65],
      [64, 12, 43, 71],
      [43, 17, 32, 21],
      [103, 8, 8, 26],
      [108, 0, 8, 30],
      [112, 0, 8, 27],
      [117, 0, 8, 24],
      [22, 88, 11, 25],
      [43, 88, 11, 25],
      [75, 83, 11, 27],
      [96, 83, 11, 27],
      [0, 59, 22, 23],
    ],
    eyes: [
      [32, 34, 11, 11],
      [86, 24, 11, 11],
    ],
  },
  {
    id: 'l004',
    tx: 2,
    ty: 3,
    body: [
      [22, 20, 42, 65],
      [64, 9, 43, 71],
      [43, 14, 32, 21],
      [22, 85, 11, 25],
      [43, 85, 11, 25],
      [75, 80, 11, 26],
      [96, 80, 11, 26],
      [0, 42, 22, 23],
      [103, 0, 22, 31],
    ],
    eyes: [
      [32, 31, 11, 11],
      [86, 20, 11, 11],
    ],
  },
  { id: 'l005', tx: 0, ty: 36, body: STAND_BODY, eyes: EYES_OPEN },
];

/** Confetti burst raining across the top — palette bits with staggered fall. */
const CONFETTI_ACCENTS: readonly RigAccent[] = (
  [
    [24, 4],
    [40, -2],
    [56, 2],
    [72, -2],
    [90, 4],
    [104, 0],
    [32, 16],
    [64, 14],
    [96, 18],
    [48, 24],
  ] as const
).map(([x, y], i) => ({
  rect: [x, y, 5, 5] as RigRect,
  fill: CONFETTI[i % CONFETTI.length] as string,
  cls: `octo-rig__accent--confetti octo-rig__accent--c${(i % 4) + 1}`,
}));

/** Dancing — arms alternate overhead as the body sways and bounces (4 frames). */
const DANCE_FRAMES: readonly RigFrame[] = [
  {
    id: 'd0',
    tx: -2,
    ty: 36,
    body: [TORSO, ...LEGS, [0, 18, 22, 24], [107, 42, 22, 21]],
    eyes: EYES_OPEN,
  },
  { id: 'd1', tx: 0, ty: 32, body: STAND_BODY, eyes: EYES_OPEN },
  {
    id: 'd2',
    tx: 2,
    ty: 36,
    body: [TORSO, ...LEGS, [0, 42, 22, 21], [107, 18, 22, 24]],
    eyes: EYES_OPEN,
  },
  { id: 'd3', tx: 0, ty: 36, body: STAND_BODY, eyes: EYES_OPEN },
];

/** Two pink notes swinging beside the dancer. */
const DANCE_NOTES: readonly RigAccent[] = [
  { rect: [98, 14, 3, 3], fill: PINK, cls: 'octo-rig__accent--swing' },
  { rect: [100, 9, 1, 6], fill: PINK, cls: 'octo-rig__accent--swing' },
  { rect: [100, 9, 3, 2], fill: PINK, cls: 'octo-rig__accent--swing' },
  { rect: [116, 8, 3, 3], fill: PINK, cls: 'octo-rig__accent--swing octo-rig__accent--delay1' },
  { rect: [118, 3, 1, 6], fill: PINK, cls: 'octo-rig__accent--swing octo-rig__accent--delay1' },
  { rect: [118, 3, 3, 2], fill: PINK, cls: 'octo-rig__accent--swing octo-rig__accent--delay1' },
];

// --- Debugging — Clawd holds the glass and inspects the floor ----------------
/**
 * A big magnifying glass (≈22-unit ring) held to inspect the floor: bold ink
 * ring + cream glass, with the handle rising UP so a reaching tentacle visibly
 * grips it (grip end lands near `x+22, y-6`). Absolute origin.
 */
function lensDown(x: number, y: number): readonly RigAccent[] {
  return [
    { rect: [x + 4, y + 4, 14, 14], fill: CREAM },
    { rect: [x + 3, y, 16, 4], fill: INK },
    { rect: [x + 3, y + 18, 16, 4], fill: INK },
    { rect: [x, y + 3, 4, 16], fill: INK },
    { rect: [x + 18, y + 3, 4, 16], fill: INK },
    { rect: [x + 18, y - 4, 4, 6], fill: INK },
    { rect: [x + 20, y - 9, 5, 6], fill: INK },
  ];
}
/** A bold ink beetle — unmistakably a bug, high-contrast on the brand body. */
function bug(x: number, y: number): readonly RigAccent[] {
  return [
    { rect: [x + 2, y, 9, 3], fill: INK },
    { rect: [x, y + 3, 13, 4], fill: INK },
    { rect: [x + 13, y + 3, 3, 3], fill: INK },
    { rect: [x + 5, y, 1, 7], fill: CREAM },
    { rect: [x - 2, y + 3, 2, 1], fill: INK },
    { rect: [x - 2, y + 6, 2, 1], fill: INK },
    { rect: [x + 3, y + 7, 1, 2], fill: INK },
    { rect: [x + 9, y + 7, 1, 2], fill: INK },
    { rect: [x + 12, y + 7, 2, 1], fill: INK },
    { rect: [x + 16, y + 1, 2, 1], fill: INK },
    { rect: [x + 16, y + 4, 1, 1], fill: CORAL },
  ];
}
/** Flattened bug — an ink smear with coral guts and stray flecks. */
function splat(x: number, y: number): readonly RigAccent[] {
  return [
    { rect: [x, y, 16, 3], fill: INK },
    { rect: [x + 3, y - 2, 3, 2], fill: INK },
    { rect: [x + 9, y - 2, 3, 2], fill: INK },
    { rect: [x + 6, y - 1, 4, 1], fill: CORAL },
    { rect: [x - 3, y + 1, 2, 1], fill: INK },
    { rect: [x + 17, y + 1, 2, 1], fill: INK },
  ];
}
/** Green "caught it" check that snaps in on the final frame. */
const DEBUG_CHECK: readonly RigAccent[] = [
  { rect: [94, 34, 4, 4], fill: GREEN },
  { rect: [98, 38, 4, 4], fill: GREEN },
  { rect: [102, 30, 4, 4], fill: GREEN },
  { rect: [106, 24, 4, 4], fill: GREEN },
  { rect: [110, 18, 4, 4], fill: GREEN },
];
/** Standing legs in absolute space (this pose bakes position, no frame translate). */
const DEBUG_LEGS: readonly RigRect[] = [
  [22, 101, 11, 12],
  [43, 101, 11, 12],
  [75, 101, 11, 12],
  [96, 101, 11, 12],
];
/** Legs under the narrower hunched-over torso (peer/spot/pounce/squash). */
const CROUCH_LEGS: readonly RigRect[] = [
  [22, 101, 11, 12],
  [40, 101, 11, 12],
  [62, 101, 11, 12],
  [80, 101, 11, 12],
];

/**
 * Bug hunt — peer → spot → pounce → squash → gotcha. Clawd hunches over the
 * floor with a tentacle visibly gripping the magnifier's handle, eyes aimed
 * DOWN through the glass; the bug scurries, gets pinned, splats, then a green
 * check snaps in. Magnifier + bug are per-frame props, choreographed by hand.
 */
const DEBUG_FRAMES: readonly RigFrame[] = [
  {
    // Hunched low over the floor, a tentacle gripping the big glass, eyes down.
    id: 'peer',
    tx: 0,
    ty: 0,
    body: [[20, 48, 80, 53], ...CROUCH_LEGS, [2, 74, 18, 16], [84, 66, 22, 12], [100, 74, 14, 14]],
    eyes: [
      [38, 78, 13, 9],
      [68, 78, 13, 9],
    ],
    props: [...lensDown(96, 84), ...bug(98, 100)],
  },
  {
    // Spotted it — eyes go wide, the glass tips toward the fleeing bug.
    id: 'spot',
    tx: 0,
    ty: 0,
    body: [[20, 46, 80, 55], ...CROUCH_LEGS, [2, 74, 18, 16], [86, 66, 22, 12], [102, 74, 14, 14]],
    eyes: [
      [36, 76, 15, 10],
      [66, 76, 15, 10],
    ],
    props: [...lensDown(98, 86), ...bug(100, 101)],
  },
  {
    // Pounce — lunge down, press the glass onto the floor over the bug.
    id: 'pounce',
    tx: 0,
    ty: 0,
    body: [[22, 52, 80, 49], ...CROUCH_LEGS, [2, 74, 18, 16], [90, 72, 22, 12], [106, 80, 14, 12]],
    eyes: [
      [36, 80, 15, 11],
      [66, 80, 15, 11],
    ],
    props: [...lensDown(100, 90), ...bug(102, 103)],
  },
  {
    // Squash — the bug splats under the lens; the body compresses on impact.
    id: 'squash',
    tx: 0,
    ty: 0,
    body: [[16, 56, 90, 45], ...CROUCH_LEGS, [2, 76, 18, 16], [86, 68, 20, 12], [100, 76, 14, 12]],
    eyes: [
      [38, 80, 13, 6],
      [68, 80, 13, 6],
    ],
    props: [...lensDown(96, 84), ...splat(98, 104)],
  },
  {
    // Gotcha — back upright, glass raised like a trophy, green check + splat.
    id: 'gotcha',
    tx: 0,
    ty: 0,
    body: [[22, 42, 82, 59], ...DEBUG_LEGS, [0, 64, 22, 20], [98, 46, 16, 14]],
    eyes: [
      [34, 60, 11, 11],
      [76, 60, 11, 11],
    ],
    props: [...lensDown(96, 52), ...splat(98, 104), ...DEBUG_CHECK],
  },
];

// --- Meditating — cross-legged, levitating on a slow Y-axis flow -------------
/** Seated body: compact torso, crossed/folded legs, hands resting on the knees. */
const SEAT_BODY: readonly RigRect[] = [
  [32, 40, 65, 42], // torso (narrower than the lap)
  [24, 80, 82, 11], // folded lap — wider than the torso (the lotus base)
  [24, 75, 15, 7], // left knee bumping up
  [90, 75, 15, 7], // right knee bumping up
  [50, 76, 12, 6], // left ankle, crossed
  [67, 76, 12, 6], // right ankle, crossed (small gap between = the cross)
  [20, 72, 15, 9], // left hand resting on the knee
  [94, 72, 15, 9], // right hand resting on the knee
];
/** Serene closed lids. */
const SEAT_EYES: readonly RigRect[] = [
  [34, 56, 11, 3],
  [84, 56, 11, 3],
];
/** A floating gold halo above the head — rides each frame's lift. */
const SEAT_HALO: readonly RigAccent[] = [
  { rect: [46, 30, 36, 3], fill: GOLD },
  { rect: [44, 27, 4, 3], fill: GOLD },
  { rect: [82, 27, 4, 3], fill: GOLD },
  { rect: [52, 25, 24, 2], fill: GOLD },
];
/** Levitation: the whole seated rig eases up and settles back (Y-axis flow). */
const MEDITATE_FRAMES: readonly RigFrame[] = [0, -2, -4, -5, -3, -1].map(
  (dy, i): RigFrame => ({
    id: `z${i}`,
    tx: 0,
    ty: dy,
    body: SEAT_BODY,
    eyes: SEAT_EYES,
    props: SEAT_HALO,
  }),
);
/** Calm aura — a few soft motes shimmering/rising beside the meditator. */
const MEDITATE_AURA: readonly RigAccent[] = [
  { rect: [18, 52, 3, 3], fill: GOLD, cls: 'octo-rig__accent--twinkle' },
  { rect: [108, 52, 3, 3], fill: GOLD, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay1' },
  { rect: [22, 68, 2, 2], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay2' },
  { rect: [105, 68, 2, 2], fill: CREAM, cls: 'octo-rig__accent--rise' },
];

// --- Deploying — Clawd rides a rocket off the launch pad ----------------------
/** The rider: compact octopus astride the tube, one tentacle thrown up. */
const RIDER: readonly RigRect[] = [
  [46, 34, 36, 30], // torso perched on the tube top
  [78, 16, 11, 20], // right tentacle thrown up (yeehaw)
  [82, 10, 9, 9], // ...its tip
  [38, 50, 10, 16], // left tentacle gripping the tube
  [42, 58, 8, 12], // left leg hugging the tube
  [78, 58, 8, 12], // right leg hugging the tube
];
const RIDER_EYES: readonly RigRect[] = [
  [52, 44, 10, 11],
  [70, 44, 10, 11],
];
/** The big rocket under the rider: cream tube, coral band + fins, a sky window. */
const ROCKET: readonly RigAccent[] = [
  { rect: [48, 62, 32, 34], fill: CREAM },
  { rect: [48, 62, 32, 4], fill: CORAL },
  { rect: [56, 70, 16, 12], fill: SKY },
  { rect: [59, 73, 10, 6], fill: WHITE },
  { rect: [38, 88, 12, 14], fill: CORAL },
  { rect: [78, 88, 12, 14], fill: CORAL },
];
/** Exhaust plume — longer `len` trails further down (clipped by the viewBox). */
function flame(len: number): readonly RigAccent[] {
  return [
    { rect: [52, 96, 24, 8], fill: GOLD },
    { rect: [56, 104, 16, 7], fill: CORAL },
    ...(len >= 1 ? [{ rect: [58, 111, 12, 10] as RigRect, fill: GOLD }] : []),
    ...(len >= 2 ? [{ rect: [59, 121, 10, 14] as RigRect, fill: CORAL }] : []),
    ...(len >= 3 ? [{ rect: [60, 135, 8, 16] as RigRect, fill: GOLD }] : []),
  ];
}
/** Countdown → ignition shudder → lift-off → soar (the whole ship shares ty). */
const DEPLOY_FRAMES: readonly RigFrame[] = [
  { id: 'count', tx: 0, ty: 0, body: RIDER, eyes: RIDER_EYES, props: [...ROCKET, ...flame(0)] },
  { id: 'ignite', tx: 1, ty: 0, body: RIDER, eyes: RIDER_EYES, props: [...ROCKET, ...flame(1)] },
  { id: 'lift1', tx: -1, ty: -10, body: RIDER, eyes: RIDER_EYES, props: [...ROCKET, ...flame(2)] },
  { id: 'lift2', tx: 1, ty: -22, body: RIDER, eyes: RIDER_EYES, props: [...ROCKET, ...flame(3)] },
  { id: 'soar', tx: 0, ty: -34, body: RIDER, eyes: RIDER_EYES, props: [...ROCKET, ...flame(3)] },
];
/** Launch smoke left on the pad — drifts/rises independently as the ship climbs. */
const DEPLOY_SMOKE: readonly RigAccent[] = [
  { rect: [34, 100, 12, 9], fill: CREAM, cls: 'octo-rig__accent--rise' },
  { rect: [82, 100, 12, 9], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
  { rect: [50, 106, 26, 6], fill: WHITE, cls: 'octo-rig__accent--rise octo-rig__accent--delay2' },
  { rect: [26, 96, 9, 7], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay1' },
  { rect: [92, 96, 9, 7], fill: CREAM, cls: 'octo-rig__accent--float' },
];

// --- Eureka — think, then the lightbulb pops and Clawd grabs the idea ---------
/** A dim, un-lit bulb over the head (the thinking beat). */
const BULB_DIM: readonly RigAccent[] = [
  { rect: [58, 14, 14, 12], fill: DIM },
  { rect: [60, 12, 10, 2], fill: DIM },
  { rect: [60, 26, 10, 3], fill: INK },
  { rect: [62, 29, 6, 2], fill: INK },
];
/** The lit bulb — gold glass, white-hot filament, ink screw base, optional rays. */
function bulbLit(rays: boolean): readonly RigAccent[] {
  return [
    { rect: [58, 12, 14, 12], fill: GOLD },
    { rect: [60, 10, 10, 2], fill: GOLD },
    { rect: [56, 14, 2, 8], fill: GOLD },
    { rect: [72, 14, 2, 8], fill: GOLD },
    { rect: [62, 14, 6, 6], fill: WHITE },
    { rect: [60, 24, 10, 3], fill: INK },
    { rect: [62, 27, 6, 2], fill: INK },
    ...(rays
      ? (
          [
            [63, 0, 3, 7],
            [46, 4, 5, 3],
            [43, 15, 6, 3],
            [79, 4, 5, 3],
            [81, 15, 6, 3],
          ] as const
        ).map((r): RigAccent => ({ rect: r as RigRect, fill: GOLD }))
      : []),
  ];
}
/** Pondering → POP (rays burst) → reach up → cup the glowing idea. */
const EUREKA_FRAMES: readonly RigFrame[] = [
  {
    id: 'think',
    tx: 0,
    ty: 0,
    body: [[22, 40, 85, 61], ...DEBUG_LEGS, [0, 66, 22, 22], [88, 56, 18, 14]],
    eyes: [
      [34, 56, 11, 10],
      [84, 56, 11, 10],
    ],
    props: BULB_DIM,
  },
  {
    id: 'ponder',
    tx: 0,
    ty: 0,
    body: [[22, 40, 85, 61], ...DEBUG_LEGS, [0, 66, 22, 22], [90, 60, 16, 12]],
    eyes: [
      [36, 56, 11, 10],
      [86, 56, 11, 10],
    ],
    props: BULB_DIM,
  },
  {
    id: 'pop',
    tx: 0,
    ty: 0,
    body: [[24, 30, 81, 71], ...DEBUG_LEGS, [4, 40, 20, 22], [105, 40, 20, 22]],
    eyes: [
      [30, 50, 15, 15],
      [84, 50, 15, 15],
    ],
    props: bulbLit(true),
  },
  {
    id: 'catch',
    tx: 0,
    ty: 0,
    body: [[26, 30, 77, 71], ...DEBUG_LEGS, [34, 12, 15, 26], [80, 12, 15, 26]],
    eyes: [
      [32, 52, 12, 12],
      [85, 52, 12, 12],
    ],
    props: bulbLit(true),
  },
  {
    id: 'hold',
    tx: 0,
    ty: 0,
    body: [[24, 34, 81, 67], ...DEBUG_LEGS, [12, 44, 18, 22], [101, 44, 18, 22]],
    eyes: [
      [32, 54, 11, 11],
      [86, 54, 11, 11],
    ],
    props: bulbLit(false),
  },
];

const HAND_POSES: Readonly<Record<string, RigPose>> = {
  idle: {
    frames: [{ id: 'idle', tx: 0, ty: 36, body: STAND_BODY, eyes: [] }],
  },
  alive: {
    frames: [
      { id: 'down', tx: 0, ty: 36, body: STAND_BODY, eyes: EYES_OPEN },
      { id: 'up', tx: 0, ty: 33, body: STAND_BODY, eyes: EYES_OPEN },
    ],
    loopMs: 1100,
  },
  working: {
    frames: [
      { id: 'a', tx: 0, ty: 36, body: STAND_BODY, eyes: EYES_OPEN },
      { id: 'b', tx: 0, ty: 34, body: STAND_BODY, eyes: EYES_OPEN },
    ],
    loopMs: 460,
  },
  thinking: {
    frames: [{ id: 'think', tx: 0, ty: 36, body: STAND_BODY, eyes: EYES_UP }],
    accents: [
      { rect: [110, 22, 6, 6], fill: INK, cls: 'octo-rig__accent--blink' },
      { rect: [118, 14, 5, 5], fill: INK, cls: 'octo-rig__accent--blink octo-rig__accent--delay1' },
      { rect: [124, 7, 4, 4], fill: INK, cls: 'octo-rig__accent--blink octo-rig__accent--delay2' },
    ],
  },
  sleeping: {
    frames: [{ id: 'sleep', tx: 0, ty: 36, body: STAND_BODY, eyes: EYES_CLOSED }],
    accents: [
      { rect: [104, 20, 7, 7], fill: INK, cls: 'octo-rig__accent--rise' },
      { rect: [112, 11, 6, 6], fill: INK, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
      { rect: [119, 4, 5, 5], fill: INK, cls: 'octo-rig__accent--rise octo-rig__accent--delay2' },
    ],
  },
  loving: {
    frames: [{ id: 'love', tx: 0, ty: 36, body: STAND_BODY, eyes: EYES_OPEN }],
    accents: [
      ...heart(92, 12, 'octo-rig__accent--float'),
      ...heart(108, 4, 'octo-rig__accent--float octo-rig__accent--delay1'),
      ...heart(100, 22, 'octo-rig__accent--float octo-rig__accent--delay2'),
    ],
  },
  celebrating: {
    frames: CONFETTI_JUMP,
    loopMs: 750,
    accents: CONFETTI_ACCENTS,
  },
  dancing: {
    frames: DANCE_FRAMES,
    loopMs: 640,
    accents: DANCE_NOTES,
  },
  debugging: {
    frames: DEBUG_FRAMES,
    loopMs: 1200,
  },
  meditating: {
    frames: MEDITATE_FRAMES,
    loopMs: 2800,
    accents: MEDITATE_AURA,
  },
  deploying: {
    frames: DEPLOY_FRAMES,
    loopMs: 900,
    accents: DEPLOY_SMOKE,
  },
  eureka: {
    frames: EUREKA_FRAMES,
    loopMs: 1600,
  },
};

const GENERATED: Record<string, RigPose> = Object.fromEntries(
  Object.entries(SPECS).map(([id, spec]) => [id, buildFromSpec(spec)]),
);

/** Registry — flagship hand poses win over generated ones on id collision. */
export const RIG_POSES: Readonly<Record<string, RigPose>> = { ...GENERATED, ...HAND_POSES };

/** Resolve a pose to its rig entry, or `undefined` when not yet migrated. */
export function getRigPose(pose: string): RigPose | undefined {
  return RIG_POSES[pose];
}
