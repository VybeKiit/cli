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
/** Dancing — full body metamorphosis: crouch→leap→peak→spin→land (5 frames). */
const DANCE_FRAMES: readonly RigFrame[] = [
  {
    id: 'd-crouch',
    tx: 0,
    ty: 12,
    body: [
      [24, 38, 80, 40],
      [16, 78, 18, 16],
      [46, 78, 16, 16],
      [66, 78, 16, 16],
      [94, 78, 18, 16],
      [8, 52, 18, 18],
      [102, 52, 18, 18],
    ],
    eyes: [
      [36, 52, 11, 8],
      [82, 52, 11, 8],
    ],
  },
  {
    id: 'd-leap',
    tx: 2,
    ty: -10,
    body: [
      [30, 18, 68, 54],
      [0, 8, 30, 18],
      [98, 12, 30, 16],
      [34, 72, 18, 24],
      [76, 72, 18, 24],
    ],
    eyes: [
      [40, 36, 12, 12],
      [78, 36, 12, 12],
    ],
  },
  {
    id: 'd-peak',
    tx: 0,
    ty: -14,
    body: [
      [34, 26, 60, 52],
      [36, 4, 22, 24],
      [70, 4, 22, 24],
      [38, 78, 18, 20],
      [72, 78, 18, 20],
    ],
    eyes: [
      [42, 42, 11, 11],
      [76, 42, 11, 11],
    ],
  },
  {
    id: 'd-spin',
    tx: -2,
    ty: -4,
    body: [
      [20, 24, 88, 52],
      [0, 32, 22, 16],
      [96, 44, 32, 14],
      [26, 76, 18, 22],
      [74, 74, 18, 22],
    ],
    eyes: [
      [32, 38, 11, 11],
      [68, 34, 11, 11],
    ],
  },
  {
    id: 'd-land',
    tx: 1,
    ty: 6,
    body: [
      [26, 32, 76, 50],
      [14, 82, 18, 16],
      [96, 82, 18, 16],
      [0, 40, 26, 16],
      [102, 44, 27, 14],
    ],
    eyes: [
      [36, 48, 11, 11],
      [82, 48, 11, 11],
    ],
  },
];

/** Rich note/sparkle field — 12 particles scattered, multi-animation. */
const DANCE_NOTES: readonly RigAccent[] = [
  { rect: [2, 10, 7, 7], fill: PINK, cls: 'octo-rig__accent--swing' },
  { rect: [4, 4, 2, 9], fill: PINK, cls: 'octo-rig__accent--swing' },
  { rect: [4, 4, 6, 3], fill: PINK, cls: 'octo-rig__accent--swing' },
  { rect: [112, 4, 7, 7], fill: PINK, cls: 'octo-rig__accent--swing octo-rig__accent--delay1' },
  { rect: [114, 0, 2, 8], fill: PINK, cls: 'octo-rig__accent--swing octo-rig__accent--delay1' },
  { rect: [114, 0, 6, 3], fill: PINK, cls: 'octo-rig__accent--swing octo-rig__accent--delay1' },
  { rect: [56, 0, 7, 7], fill: CORAL, cls: 'octo-rig__accent--swing octo-rig__accent--delay2' },
  { rect: [58, 0, 2, 5], fill: CORAL, cls: 'octo-rig__accent--swing octo-rig__accent--delay2' },
  { rect: [18, 4, 4, 4], fill: GOLD, cls: 'octo-rig__accent--twinkle' },
  { rect: [108, 20, 4, 4], fill: GOLD, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay1' },
  { rect: [8, 28, 3, 3], fill: SKY, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay2' },
  { rect: [120, 30, 3, 3], fill: SKY, cls: 'octo-rig__accent--pop' },
];

// --- Debugging — full metamorphosis bug hunt with ambient particles -----------
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
function bug(x: number, y: number): readonly RigAccent[] {
  return [
    { rect: [x + 2, y, 9, 3], fill: INK },
    { rect: [x, y + 3, 13, 4], fill: INK },
    { rect: [x + 5, y, 1, 7], fill: CREAM },
    { rect: [x + 16, y + 1, 2, 1], fill: INK },
    { rect: [x + 16, y + 4, 1, 1], fill: CORAL },
  ];
}
function splat(x: number, y: number): readonly RigAccent[] {
  return [
    { rect: [x, y, 16, 3], fill: INK },
    { rect: [x + 3, y - 2, 3, 2], fill: INK },
    { rect: [x + 9, y - 2, 3, 2], fill: INK },
    { rect: [x + 6, y - 1, 4, 1], fill: CORAL },
  ];
}
const DEBUG_CHECK: readonly RigAccent[] = [
  { rect: [94, 34, 4, 4], fill: GREEN },
  { rect: [98, 38, 4, 4], fill: GREEN },
  { rect: [102, 30, 4, 4], fill: GREEN },
  { rect: [106, 24, 4, 4], fill: GREEN },
  { rect: [110, 18, 4, 4], fill: GREEN },
];

const DEBUG_FRAMES: readonly RigFrame[] = [
  {
    id: 'peer',
    tx: 0,
    ty: 0,
    body: [
      [14, 50, 86, 40],
      [20, 90, 18, 18],
      [64, 90, 18, 18],
      [2, 66, 16, 18],
      [88, 56, 22, 16],
    ],
    eyes: [
      [32, 68, 14, 8],
      [62, 68, 14, 8],
    ],
    props: [...lensDown(100, 80), ...bug(54, 108)],
  },
  {
    id: 'spot',
    tx: 3,
    ty: -2,
    body: [
      [10, 44, 80, 48],
      [86, 40, 28, 20],
      [18, 92, 18, 16],
      [62, 92, 18, 16],
      [0, 60, 14, 18],
      [92, 54, 22, 16],
    ],
    eyes: [
      [28, 62, 16, 14],
      [58, 62, 16, 14],
    ],
    props: [...lensDown(104, 76), ...bug(58, 108)],
  },
  {
    id: 'pounce',
    tx: 0,
    ty: 6,
    body: [
      [8, 54, 98, 34],
      [20, 88, 18, 20],
      [72, 88, 18, 20],
      [0, 64, 12, 14],
      [100, 58, 28, 16],
    ],
    eyes: [
      [34, 70, 14, 6],
      [64, 70, 14, 6],
    ],
    props: [...lensDown(102, 84), ...bug(58, 106)],
  },
  {
    id: 'squash',
    tx: -1,
    ty: 2,
    body: [
      [14, 48, 92, 42],
      [22, 90, 18, 18],
      [72, 90, 18, 18],
      [2, 62, 16, 16],
      [96, 54, 22, 16],
    ],
    eyes: [
      [30, 66, 13, 8],
      [66, 66, 13, 8],
    ],
    props: [...lensDown(98, 82), ...splat(56, 108)],
  },
  {
    id: 'gotcha',
    tx: 0,
    ty: -6,
    body: [
      [26, 36, 76, 58],
      [28, 94, 18, 16],
      [78, 94, 18, 16],
      [6, 52, 22, 18],
      [96, 18, 22, 24],
    ],
    eyes: [
      [36, 52, 12, 12],
      [80, 52, 12, 12],
    ],
    props: [...lensDown(100, 20), ...splat(56, 108), ...DEBUG_CHECK],
  },
];
const DEBUG_PARTICLES: readonly RigAccent[] = [
  { rect: [8, 88, 4, 4], fill: CREAM, cls: 'octo-rig__accent--twinkle' },
  { rect: [20, 106, 3, 3], fill: CREAM, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay1' },
  {
    rect: [110, 100, 4, 4],
    fill: CREAM,
    cls: 'octo-rig__accent--twinkle octo-rig__accent--delay2',
  },
  { rect: [4, 100, 3, 3], fill: GOLD, cls: 'octo-rig__accent--float' },
  { rect: [118, 88, 3, 3], fill: GOLD, cls: 'octo-rig__accent--float octo-rig__accent--delay1' },
  { rect: [50, 2, 5, 5], fill: SKY, cls: 'octo-rig__accent--blink' },
  { rect: [76, 4, 4, 4], fill: SKY, cls: 'octo-rig__accent--blink octo-rig__accent--delay1' },
  { rect: [36, 110, 3, 3], fill: CREAM, cls: 'octo-rig__accent--rise' },
];

// --- Meditating — body breathes (expand/contract) with rich aura field --------
const SEAT_EYES: readonly RigRect[] = [
  [34, 56, 11, 3],
  [84, 56, 11, 3],
];
const SEAT_HALO: readonly RigAccent[] = [
  { rect: [46, 30, 36, 3], fill: GOLD },
  { rect: [44, 27, 4, 3], fill: GOLD },
  { rect: [82, 27, 4, 3], fill: GOLD },
  { rect: [52, 25, 24, 2], fill: GOLD },
];
const MEDITATE_FRAMES: readonly RigFrame[] = [
  {
    id: 'z0',
    tx: 0,
    ty: 0,
    body: [
      [34, 42, 60, 38],
      [26, 78, 76, 12],
      [26, 73, 14, 7],
      [88, 73, 14, 7],
      [50, 75, 12, 5],
      [66, 75, 12, 5],
      [22, 70, 14, 8],
      [92, 70, 14, 8],
    ],
    eyes: SEAT_EYES,
    props: SEAT_HALO,
  },
  {
    id: 'z1',
    tx: 0,
    ty: -2,
    body: [
      [32, 40, 64, 40],
      [24, 78, 80, 13],
      [22, 72, 16, 8],
      [90, 72, 16, 8],
      [48, 74, 14, 5],
      [66, 74, 14, 5],
      [18, 66, 16, 10],
      [94, 66, 16, 10],
    ],
    eyes: SEAT_EYES,
    props: SEAT_HALO,
  },
  {
    id: 'z2',
    tx: 0,
    ty: -5,
    body: [
      [28, 36, 72, 44],
      [22, 78, 84, 14],
      [18, 70, 18, 10],
      [92, 70, 18, 10],
      [46, 73, 14, 6],
      [68, 73, 14, 6],
      [12, 58, 18, 12],
      [98, 58, 18, 12],
      [14, 54, 8, 6],
      [106, 54, 8, 6],
    ],
    eyes: [
      [34, 52, 11, 2],
      [84, 52, 11, 2],
    ],
    props: SEAT_HALO,
  },
  {
    id: 'z3',
    tx: 0,
    ty: -4,
    body: [
      [30, 37, 68, 43],
      [24, 78, 80, 13],
      [20, 71, 17, 9],
      [91, 71, 17, 9],
      [47, 73, 14, 6],
      [67, 73, 14, 6],
      [14, 60, 17, 11],
      [97, 60, 17, 11],
      [16, 56, 7, 5],
      [105, 56, 7, 5],
    ],
    eyes: [
      [34, 52, 11, 2],
      [84, 52, 11, 2],
    ],
    props: SEAT_HALO,
  },
  {
    id: 'z4',
    tx: 0,
    ty: -2,
    body: [
      [33, 40, 62, 40],
      [26, 78, 76, 12],
      [24, 73, 15, 7],
      [89, 73, 15, 7],
      [50, 75, 12, 5],
      [66, 75, 12, 5],
      [20, 68, 15, 9],
      [93, 68, 15, 9],
    ],
    eyes: SEAT_EYES,
    props: SEAT_HALO,
  },
  {
    id: 'z5',
    tx: 0,
    ty: -1,
    body: [
      [36, 43, 56, 36],
      [28, 78, 72, 11],
      [28, 74, 13, 6],
      [87, 74, 13, 6],
      [52, 76, 11, 4],
      [65, 76, 11, 4],
      [24, 72, 13, 7],
      [91, 72, 13, 7],
    ],
    eyes: SEAT_EYES,
    props: SEAT_HALO,
  },
];
const MEDITATE_AURA: readonly RigAccent[] = [
  { rect: [14, 48, 4, 4], fill: GOLD, cls: 'octo-rig__accent--twinkle' },
  { rect: [110, 48, 4, 4], fill: GOLD, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay1' },
  { rect: [8, 64, 3, 3], fill: CREAM, cls: 'octo-rig__accent--rise' },
  { rect: [116, 64, 3, 3], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
  { rect: [20, 34, 3, 3], fill: GOLD, cls: 'octo-rig__accent--float octo-rig__accent--delay2' },
  { rect: [106, 34, 3, 3], fill: GOLD, cls: 'octo-rig__accent--float' },
  { rect: [12, 80, 3, 3], fill: SKY, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay2' },
  { rect: [114, 80, 3, 3], fill: SKY, cls: 'octo-rig__accent--twinkle' },
  { rect: [6, 56, 2, 2], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay2' },
  { rect: [120, 56, 2, 2], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
];

// --- Deploying — recognizable Claude octopus ON a big rocket, body reacts -----
const ROCKET: readonly RigAccent[] = [
  { rect: [48, 62, 32, 34], fill: CREAM },
  { rect: [48, 62, 32, 4], fill: CORAL },
  { rect: [56, 70, 16, 12], fill: SKY },
  { rect: [59, 73, 10, 6], fill: WHITE },
  { rect: [54, 56, 20, 8], fill: CREAM },
  { rect: [58, 52, 12, 6], fill: CREAM },
  { rect: [38, 88, 12, 14], fill: CORAL },
  { rect: [78, 88, 12, 14], fill: CORAL },
  { rect: [44, 94, 6, 10], fill: CORAL },
  { rect: [78, 94, 6, 10], fill: CORAL },
];
function flame(len: number): readonly RigAccent[] {
  return [
    { rect: [52, 96, 24, 8], fill: GOLD },
    { rect: [56, 104, 16, 7], fill: CORAL },
    ...(len >= 1 ? [{ rect: [58, 111, 12, 10] as RigRect, fill: GOLD }] : []),
    ...(len >= 2 ? [{ rect: [59, 121, 10, 14] as RigRect, fill: CORAL }] : []),
    ...(len >= 3 ? [{ rect: [60, 135, 8, 16] as RigRect, fill: GOLD }] : []),
  ];
}
/** The Claude octopus body — recognizable silhouette with torso+legs+hands+eyes sitting on rocket */
const DEPLOY_FRAMES: readonly RigFrame[] = [
  {
    id: 'count',
    tx: 0,
    ty: 0,
    body: [
      [32, 18, 64, 38],
      [24, 36, 16, 20],
      [88, 36, 16, 20],
      [40, 52, 14, 12],
      [74, 52, 14, 12],
    ],
    eyes: [
      [44, 28, 10, 10],
      [74, 28, 10, 10],
    ],
    props: [...ROCKET, ...flame(0)],
  },
  {
    id: 'ignite',
    tx: 1,
    ty: -4,
    body: [
      [30, 14, 68, 40],
      [20, 18, 18, 20],
      [90, 20, 18, 18],
      [40, 50, 14, 14],
      [74, 50, 14, 14],
    ],
    eyes: [
      [44, 26, 12, 12],
      [72, 26, 12, 12],
    ],
    props: [...ROCKET, ...flame(1)],
  },
  {
    id: 'lift1',
    tx: -1,
    ty: -14,
    body: [
      [34, 20, 60, 34],
      [26, 24, 14, 20],
      [88, 24, 14, 20],
      [42, 50, 12, 12],
      [74, 50, 12, 12],
    ],
    eyes: [
      [46, 28, 8, 8],
      [74, 28, 8, 8],
    ],
    props: [...ROCKET, ...flame(2)],
  },
  {
    id: 'lift2',
    tx: 1,
    ty: -26,
    body: [
      [30, 16, 68, 38],
      [18, 18, 18, 16],
      [92, 18, 18, 16],
      [14, 14, 12, 10],
      [104, 14, 12, 10],
      [40, 50, 14, 14],
      [74, 50, 14, 14],
    ],
    eyes: [
      [44, 26, 10, 10],
      [74, 26, 10, 10],
    ],
    props: [...ROCKET, ...flame(3)],
  },
  {
    id: 'soar',
    tx: 0,
    ty: -36,
    body: [
      [30, 16, 68, 38],
      [16, 4, 20, 18],
      [22, 0, 12, 8],
      [92, 4, 20, 18],
      [96, 0, 12, 8],
      [40, 50, 14, 14],
      [74, 50, 14, 14],
    ],
    eyes: [
      [44, 26, 10, 10],
      [74, 26, 10, 10],
    ],
    props: [...ROCKET, ...flame(3)],
  },
];
const DEPLOY_SMOKE: readonly RigAccent[] = [
  { rect: [30, 100, 14, 10], fill: CREAM, cls: 'octo-rig__accent--rise' },
  { rect: [84, 100, 14, 10], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
  { rect: [48, 108, 30, 7], fill: WHITE, cls: 'octo-rig__accent--rise octo-rig__accent--delay2' },
  { rect: [22, 94, 10, 8], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay1' },
  { rect: [96, 94, 10, 8], fill: CREAM, cls: 'octo-rig__accent--float' },
  { rect: [38, 104, 8, 6], fill: WHITE, cls: 'octo-rig__accent--rise' },
  { rect: [82, 104, 8, 6], fill: WHITE, cls: 'octo-rig__accent--rise octo-rig__accent--delay2' },
  { rect: [14, 98, 7, 5], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay2' },
  { rect: [106, 98, 7, 5], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay1' },
  { rect: [60, 110, 8, 3], fill: WHITE, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
];

// --- Eureka — think → ponder → POP → catch → hold with sparkle field ----------
const BULB_DIM: readonly RigAccent[] = [
  { rect: [58, 14, 14, 12], fill: DIM },
  { rect: [60, 12, 10, 2], fill: DIM },
  { rect: [60, 26, 10, 3], fill: INK },
  { rect: [62, 29, 6, 2], fill: INK },
];
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
const EUREKA_FRAMES: readonly RigFrame[] = [
  {
    id: 'think',
    tx: 0,
    ty: 4,
    body: [
      [28, 42, 72, 54],
      [28, 96, 12, 14],
      [46, 96, 11, 14],
      [72, 96, 11, 14],
      [90, 96, 12, 14],
      [4, 60, 24, 18],
      [92, 54, 16, 14],
      [102, 48, 10, 10],
    ],
    eyes: [
      [36, 60, 10, 8],
      [80, 60, 10, 8],
    ],
    props: BULB_DIM,
  },
  {
    id: 'ponder',
    tx: 0,
    ty: 2,
    body: [
      [26, 40, 76, 56],
      [26, 96, 12, 14],
      [44, 96, 11, 14],
      [72, 96, 11, 14],
      [90, 96, 12, 14],
      [4, 58, 22, 18],
      [96, 42, 18, 16],
      [108, 36, 12, 10],
    ],
    eyes: [
      [36, 58, 11, 9],
      [82, 58, 11, 9],
    ],
    props: BULB_DIM,
  },
  {
    id: 'pop',
    tx: 0,
    ty: -4,
    body: [
      [18, 30, 92, 68],
      [22, 98, 14, 14],
      [42, 98, 12, 14],
      [74, 98, 12, 14],
      [92, 98, 14, 14],
      [0, 38, 20, 24],
      [108, 38, 20, 24],
    ],
    eyes: [
      [30, 52, 18, 18],
      [80, 52, 18, 18],
    ],
    props: bulbLit(true),
  },
  {
    id: 'catch',
    tx: 0,
    ty: -2,
    body: [
      [30, 34, 68, 64],
      [30, 98, 12, 14],
      [48, 98, 11, 14],
      [70, 98, 11, 14],
      [88, 98, 12, 14],
      [34, 10, 18, 28],
      [76, 10, 18, 28],
      [38, 4, 12, 10],
      [78, 4, 12, 10],
    ],
    eyes: [
      [38, 52, 12, 12],
      [78, 52, 12, 12],
    ],
    props: bulbLit(true),
  },
  {
    id: 'hold',
    tx: 0,
    ty: 0,
    body: [
      [26, 36, 76, 62],
      [26, 98, 12, 14],
      [44, 98, 11, 14],
      [72, 98, 11, 14],
      [90, 98, 12, 14],
      [16, 40, 16, 22],
      [96, 40, 16, 22],
    ],
    eyes: [
      [36, 54, 11, 11],
      [82, 54, 11, 11],
    ],
    props: bulbLit(false),
  },
];
const EUREKA_SPARKLES: readonly RigAccent[] = [
  { rect: [40, 4, 5, 5], fill: GOLD, cls: 'octo-rig__accent--twinkle' },
  { rect: [84, 4, 5, 5], fill: GOLD, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay1' },
  { rect: [22, 18, 4, 4], fill: GOLD, cls: 'octo-rig__accent--pop' },
  { rect: [102, 18, 4, 4], fill: GOLD, cls: 'octo-rig__accent--pop octo-rig__accent--delay1' },
  { rect: [14, 34, 3, 3], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay2' },
  { rect: [112, 34, 3, 3], fill: CREAM, cls: 'octo-rig__accent--float' },
  { rect: [6, 50, 3, 3], fill: SKY, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay2' },
  { rect: [120, 50, 3, 3], fill: SKY, cls: 'octo-rig__accent--twinkle' },
];

// --- Walking — full stride cycle (5 frames, 800ms) ----------------------------
const WALK_FRAMES: readonly RigFrame[] = [
  // Contact: left leg forward, right arm forward — wide stance
  {
    id: 'w-contact',
    tx: -4,
    ty: 36,
    body: [
      [28, 0, 72, 52], // torso
      [6, 28, 22, 18], // left arm back
      [100, 20, 22, 18], // right arm forward
      [30, 52, 18, 26], // left leg forward (extended)
      [76, 52, 18, 22], // right leg back
    ],
    eyes: EYES_OPEN,
  },
  // Pass: legs together, arms mid-swing
  {
    id: 'w-pass',
    tx: 0,
    ty: 34,
    body: [
      [26, 0, 76, 54], // torso (slightly taller upright)
      [8, 32, 20, 16], // left arm mid
      [100, 32, 20, 16], // right arm mid
      [42, 54, 18, 24], // left leg (under body)
      [68, 54, 18, 24], // right leg (under body)
    ],
    eyes: EYES_OPEN,
  },
  // Push: right leg forward, left arm forward — opposite stride
  {
    id: 'w-push',
    tx: 4,
    ty: 32,
    body: [
      [28, 0, 72, 52], // torso
      [100, 28, 22, 18], // right arm back
      [6, 20, 22, 18], // left arm forward
      [76, 52, 18, 26], // right leg forward (extended)
      [30, 52, 18, 22], // left leg back
    ],
    eyes: EYES_OPEN,
  },
  // Swing: legs together again, arms swinging through
  {
    id: 'w-swing',
    tx: 0,
    ty: 30,
    body: [
      [26, 0, 76, 54], // torso
      [100, 30, 20, 16], // right arm mid
      [8, 30, 20, 16], // left arm mid
      [42, 54, 18, 24], // legs together
      [68, 54, 18, 24],
    ],
    eyes: EYES_OPEN,
  },
  // Land: back to contact mirror — right leg forward, left arm forward
  {
    id: 'w-land',
    tx: -2,
    ty: 36,
    body: [
      [28, 0, 72, 52], // torso
      [6, 20, 22, 18], // left arm forward
      [100, 28, 22, 18], // right arm back
      [72, 52, 18, 26], // right leg forward
      [34, 52, 18, 22], // left leg back
    ],
    eyes: EYES_OPEN,
  },
];
const WALK_DUST: readonly RigAccent[] = [
  { rect: [16, 92, 5, 4], fill: CREAM, cls: 'octo-rig__accent--rise' },
  { rect: [86, 92, 5, 4], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
  { rect: [50, 94, 4, 3], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay2' },
  { rect: [108, 90, 4, 3], fill: CREAM, cls: 'octo-rig__accent--float' },
  { rect: [4, 90, 3, 3], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay1' },
  { rect: [34, 96, 3, 3], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
  { rect: [72, 96, 3, 3], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay2' },
  { rect: [60, 90, 4, 4], fill: WHITE, cls: 'octo-rig__accent--float octo-rig__accent--delay2' },
];

// --- Weights — powerlifting: setup→deadlift→clean→press→flex (5 frames) -------
function barbell(y: number): readonly RigAccent[] {
  return [
    { rect: [6, y, 116, 8], fill: INK }, // bar — thick & wide
    { rect: [0, y - 6, 16, 20], fill: INK }, // left plate outer
    { rect: [16, y - 4, 12, 16], fill: CORAL }, // left plate inner
    { rect: [112, y - 6, 16, 20], fill: INK }, // right plate outer
    { rect: [100, y - 4, 12, 16], fill: CORAL }, // right plate inner
  ];
}
const WEIGHTS_FRAMES: readonly RigFrame[] = [
  // Setup: crouching low, hands gripping bar at floor level
  {
    id: 'wt-setup',
    tx: 0,
    ty: 18,
    body: [
      [28, 26, 72, 36], // wide low torso (crouching)
      [22, 60, 20, 22], // left leg bent
      [86, 60, 20, 22], // right leg bent
      [16, 48, 18, 16], // left arm reaching down
      [94, 48, 18, 16], // right arm reaching down
    ],
    eyes: [
      [40, 38, 10, 8],
      [78, 38, 10, 8],
    ],
    props: barbell(78),
  },
  // Deadlift: pulling bar to waist, body straightening
  {
    id: 'wt-dead',
    tx: 0,
    ty: 10,
    body: [
      [30, 14, 68, 46], // torso rising
      [24, 60, 20, 24], // left leg straightening
      [84, 60, 20, 24], // right leg straightening
      [18, 42, 16, 22], // left arm pulling
      [94, 42, 16, 22], // right arm pulling
    ],
    eyes: [
      [40, 26, 10, 10],
      [78, 26, 10, 10],
    ],
    props: barbell(58),
  },
  // Clean: bar at chest height, elbows up
  {
    id: 'wt-clean',
    tx: 0,
    ty: 2,
    body: [
      [30, 10, 68, 52], // full torso upright
      [26, 62, 18, 22], // left leg straight
      [84, 62, 18, 22], // right leg straight
      [14, 16, 18, 24], // left arm holding high
      [96, 16, 18, 24], // right arm holding high
    ],
    eyes: [
      [40, 22, 10, 10],
      [78, 22, 10, 10],
    ],
    props: barbell(32),
  },
  // Press: bar overhead, body stretched tall
  {
    id: 'wt-press',
    tx: 0,
    ty: -4,
    body: [
      [32, 18, 64, 48], // torso compressed under effort
      [28, 66, 18, 22], // left leg braced
      [82, 66, 18, 22], // right leg braced
      [22, 0, 16, 22], // left arm up
      [90, 0, 16, 22], // right arm up
    ],
    eyes: [
      [42, 30, 10, 10],
      [76, 30, 10, 10],
    ],
    props: barbell(6),
  },
  // Flex: triumphant, bar held high, arms bulging
  {
    id: 'wt-flex',
    tx: 0,
    ty: -6,
    body: [
      [28, 20, 72, 50], // torso puffed proudly
      [24, 70, 20, 22], // left leg wide stance
      [84, 70, 20, 22], // right leg wide stance
      [10, 2, 22, 24], // left arm flexed wide
      [96, 2, 22, 24], // right arm flexed wide
    ],
    eyes: [
      [38, 32, 12, 12],
      [78, 32, 12, 12],
    ],
    props: barbell(2),
  },
];
const WEIGHTS_EFFORT: readonly RigAccent[] = [
  { rect: [14, 18, 4, 6], fill: SKY, cls: 'octo-rig__accent--drop' },
  { rect: [110, 18, 4, 6], fill: SKY, cls: 'octo-rig__accent--drop octo-rig__accent--delay1' },
  { rect: [6, 32, 3, 5], fill: SKY, cls: 'octo-rig__accent--drop octo-rig__accent--delay2' },
  { rect: [120, 32, 3, 5], fill: SKY, cls: 'octo-rig__accent--drop' },
  { rect: [50, 4, 4, 4], fill: GOLD, cls: 'octo-rig__accent--pop' },
  { rect: [76, 4, 4, 4], fill: GOLD, cls: 'octo-rig__accent--pop octo-rig__accent--delay1' },
  { rect: [20, 42, 3, 3], fill: CORAL, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay2' },
  { rect: [106, 42, 3, 3], fill: CORAL, cls: 'octo-rig__accent--twinkle' },
];

// --- Flag-wave — proud flag bearer (5 frames, 900ms) --------------------------
const FLAG_CLOTH: readonly RigRect[][] = [
  [
    [80, 6, 30, 20],
    [108, 10, 8, 12],
  ],
  [
    [80, 4, 28, 22],
    [106, 8, 10, 14],
    [114, 12, 4, 8],
  ],
  [
    [78, 6, 32, 18],
    [108, 4, 8, 14],
    [112, 10, 6, 6],
  ],
  [
    [80, 8, 26, 20],
    [104, 6, 10, 16],
    [112, 10, 6, 8],
  ],
  [
    [78, 4, 30, 22],
    [106, 10, 8, 12],
  ],
];
function flag(phase: number): readonly RigAccent[] {
  const cloth = FLAG_CLOTH[phase] ?? FLAG_CLOTH[0] ?? [];
  return [
    { rect: [78, 24, 4, 44], fill: INK },
    { rect: [76, 22, 8, 4], fill: GOLD },
    ...cloth.map((r): RigAccent => ({ rect: r as RigRect, fill: CORAL })),
    { rect: [82, 14, 20, 4], fill: WHITE },
  ];
}
const FLAG_FRAMES: readonly RigFrame[] = [
  {
    id: 'f-plant',
    tx: 0,
    ty: 36,
    body: [
      [22, 0, 80, 56], // torso
      [0, 30, 22, 20], // left arm out
      [96, 10, 18, 32], // right arm holding pole
      [28, 56, 18, 18], // left leg
      [82, 56, 18, 18], // right leg
    ],
    eyes: EYES_OPEN,
    props: flag(0),
  },
  {
    id: 'f-right',
    tx: -2,
    ty: 34,
    body: [
      [18, 2, 82, 54], // torso shifted
      [0, 24, 20, 20], // left arm out wide
      [94, 8, 18, 34], // right arm holding pole
      [22, 56, 18, 20], // left leg
      [78, 58, 18, 18], // right leg
    ],
    eyes: EYES_OPEN,
    props: flag(1),
  },
  {
    id: 'f-peak',
    tx: 0,
    ty: 30,
    body: [
      [26, 4, 72, 52], // torso (raised)
      [6, 28, 22, 18], // left arm
      [94, 2, 18, 36], // right arm reaching up
      [32, 56, 18, 20], // left leg
      [78, 56, 18, 20], // right leg
    ],
    eyes: EYES_UP,
    props: flag(2),
  },
  {
    id: 'f-left',
    tx: 2,
    ty: 34,
    body: [
      [24, 2, 82, 54], // torso shifted
      [4, 28, 22, 20], // left arm
      [100, 10, 18, 32], // right arm holding
      [34, 56, 18, 20], // left leg
      [84, 56, 18, 18], // right leg
    ],
    eyes: EYES_OPEN,
    props: flag(3),
  },
  {
    id: 'f-settle',
    tx: 0,
    ty: 36,
    body: [
      [24, 0, 78, 58], // torso
      [2, 32, 22, 18], // left arm
      [96, 10, 18, 32], // right arm holding
      [30, 58, 18, 18], // left leg
      [80, 58, 18, 18], // right leg
    ],
    eyes: EYES_OPEN,
    props: flag(4),
  },
];
const FLAG_BREEZE: readonly RigAccent[] = [
  { rect: [4, 12, 4, 3], fill: CREAM, cls: 'octo-rig__accent--float' },
  { rect: [16, 6, 3, 3], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay1' },
  { rect: [62, 2, 4, 3], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay2' },
  { rect: [118, 18, 4, 3], fill: CREAM, cls: 'octo-rig__accent--float' },
  { rect: [10, 24, 3, 3], fill: SKY, cls: 'octo-rig__accent--float octo-rig__accent--delay2' },
  { rect: [124, 8, 3, 3], fill: CORAL, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay1' },
  { rect: [46, 0, 3, 3], fill: GOLD, cls: 'octo-rig__accent--twinkle' },
  { rect: [2, 38, 3, 3], fill: CREAM, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
];

// --- Alive — idle breathing with body expansion/contraction (5 frames) --------
const ALIVE_FRAMES: readonly RigFrame[] = [
  {
    id: 'a-rest',
    tx: 0,
    ty: 36,
    body: [
      [24, 0, 80, 58], // torso neutral
      [4, 34, 20, 20], // left hand
      [104, 34, 20, 20], // right hand
      [28, 58, 16, 16], // legs
      [84, 58, 16, 16],
    ],
    eyes: EYES_OPEN,
  },
  {
    id: 'a-inhale',
    tx: 0,
    ty: 34,
    body: [
      [22, 0, 84, 60], // torso expanding
      [2, 32, 22, 22], // hands widen
      [104, 32, 22, 22],
      [26, 60, 18, 16], // legs stable
      [84, 60, 18, 16],
    ],
    eyes: EYES_OPEN,
  },
  {
    id: 'a-full',
    tx: 0,
    ty: 32,
    body: [
      [20, 0, 88, 62], // torso at max
      [0, 30, 22, 24], // hands widest
      [106, 30, 22, 24],
      [24, 62, 18, 16], // legs push out
      [86, 62, 18, 16],
    ],
    eyes: EYES_OPEN,
  },
  {
    id: 'a-exhale',
    tx: 0,
    ty: 34,
    body: [
      [22, 0, 84, 60], // torso contracting
      [2, 32, 22, 22],
      [104, 32, 22, 22],
      [26, 60, 18, 16],
      [84, 60, 18, 16],
    ],
    eyes: EYES_OPEN,
  },
  {
    id: 'a-settle',
    tx: 0,
    ty: 36,
    body: [
      [26, 0, 76, 56], // torso slightly smaller
      [6, 36, 20, 20], // hands pulled in
      [102, 36, 20, 20],
      [30, 56, 16, 16],
      [82, 56, 16, 16],
    ],
    eyes: EYES_OPEN,
  },
];
const ALIVE_PARTICLES: readonly RigAccent[] = [
  { rect: [60, 80, 4, 4], fill: CREAM, cls: 'octo-rig__accent--float' },
  { rect: [8, 66, 3, 3], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay1' },
  { rect: [118, 66, 3, 3], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay2' },
  { rect: [44, 82, 3, 3], fill: WHITE, cls: 'octo-rig__accent--rise' },
  { rect: [80, 82, 3, 3], fill: WHITE, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
];

// --- Working — typing at keyboard with body bob (5 frames) --------------------
function keyboard(): readonly RigAccent[] {
  return [
    { rect: [24, 84, 80, 8], fill: INK }, // keyboard base
    { rect: [28, 82, 8, 4], fill: CREAM }, // key row 1
    { rect: [40, 82, 8, 4], fill: CREAM },
    { rect: [52, 82, 8, 4], fill: CREAM },
    { rect: [64, 82, 8, 4], fill: CREAM },
    { rect: [76, 82, 8, 4], fill: CREAM },
    { rect: [88, 82, 8, 4], fill: CREAM },
    { rect: [18, 72, 92, 10], fill: DIM }, // screen
    { rect: [20, 74, 88, 6], fill: SKY }, // screen glow
  ];
}
const WORKING_FRAMES: readonly RigFrame[] = [
  {
    id: 'wk-type1',
    tx: 0,
    ty: 36,
    body: [
      [28, 0, 72, 52], // torso
      [10, 40, 20, 18], // left arm at keyboard
      [98, 40, 20, 18], // right arm at keyboard
      [34, 52, 16, 16], // legs
      [78, 52, 16, 16],
    ],
    eyes: [
      [38, 16, 10, 8],
      [80, 16, 10, 8],
    ],
    props: keyboard(),
  },
  {
    id: 'wk-type2',
    tx: 0,
    ty: 34,
    body: [
      [28, 0, 72, 54], // torso dips
      [8, 38, 22, 18], // left arm tapping
      [98, 42, 20, 16], // right arm
      [34, 54, 16, 14],
      [78, 54, 16, 14],
    ],
    eyes: [
      [38, 16, 10, 8],
      [80, 16, 10, 8],
    ],
    props: keyboard(),
  },
  {
    id: 'wk-pause',
    tx: 0,
    ty: 32,
    body: [
      [30, 0, 68, 50], // torso leans back
      [14, 36, 18, 18], // arms lifted off
      [96, 36, 18, 18],
      [36, 50, 16, 16],
      [76, 50, 16, 16],
    ],
    eyes: EYES_UP,
    props: keyboard(),
  },
  {
    id: 'wk-type3',
    tx: -1,
    ty: 34,
    body: [
      [28, 0, 72, 54], // torso leans left
      [6, 36, 22, 20], // left arm extended
      [98, 42, 20, 16],
      [34, 54, 16, 14],
      [78, 54, 16, 14],
    ],
    eyes: [
      [38, 16, 10, 8],
      [80, 16, 10, 8],
    ],
    props: keyboard(),
  },
  {
    id: 'wk-type4',
    tx: 1,
    ty: 34,
    body: [
      [28, 0, 72, 54], // torso leans right
      [10, 42, 20, 16],
      [96, 36, 22, 20], // right arm extended
      [34, 54, 16, 14],
      [78, 54, 16, 14],
    ],
    eyes: [
      [38, 16, 10, 8],
      [80, 16, 10, 8],
    ],
    props: keyboard(),
  },
];
const WORKING_PARTICLES: readonly RigAccent[] = [
  { rect: [36, 66, 3, 4], fill: GREEN, cls: 'octo-rig__accent--blink' },
  { rect: [56, 66, 3, 4], fill: GREEN, cls: 'octo-rig__accent--blink octo-rig__accent--delay1' },
  { rect: [76, 66, 3, 4], fill: GREEN, cls: 'octo-rig__accent--blink octo-rig__accent--delay2' },
  { rect: [46, 64, 2, 3], fill: CREAM, cls: 'octo-rig__accent--blink octo-rig__accent--delay2' },
  { rect: [66, 64, 2, 3], fill: CREAM, cls: 'octo-rig__accent--blink octo-rig__accent--delay1' },
  { rect: [110, 4, 4, 4], fill: GOLD, cls: 'octo-rig__accent--twinkle' },
  { rect: [12, 8, 3, 3], fill: SKY, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay1' },
];

// --- Thinking — hand on chin, leaning, posture shifts (5 frames) --------------
const THINKING_FRAMES: readonly RigFrame[] = [
  {
    id: 'tk-ponder',
    tx: 0,
    ty: 36,
    body: [
      [26, 0, 76, 58], // torso neutral
      [4, 34, 22, 20], // left hand at side
      [98, 14, 18, 24], // right hand on chin
      [30, 58, 16, 16], // legs
      [82, 58, 16, 16],
    ],
    eyes: EYES_UP,
  },
  {
    id: 'tk-lean',
    tx: 2,
    ty: 34,
    body: [
      [28, 2, 74, 56], // torso leaning right
      [6, 30, 22, 20], // left hand drops
      [100, 10, 20, 26], // right hand still on chin
      [34, 58, 16, 16],
      [84, 58, 16, 16],
    ],
    eyes: EYES_UP,
  },
  {
    id: 'tk-tilt',
    tx: -2,
    ty: 32,
    body: [
      [22, 0, 80, 58], // torso tilts left
      [2, 28, 22, 22], // left arm out for balance
      [96, 16, 20, 22], // right hand high on chin
      [28, 58, 16, 16],
      [80, 58, 16, 16],
    ],
    eyes: [
      [32, 21, 11, 11],
      [86, 21, 11, 11],
    ],
  },
  {
    id: 'tk-aha',
    tx: 0,
    ty: 30,
    body: [
      [24, 0, 80, 56], // torso lifts
      [4, 34, 22, 18], // left hand
      [100, 4, 20, 22], // right hand raised (idea!)
      [30, 56, 16, 16],
      [82, 56, 16, 16],
    ],
    eyes: [
      [32, 20, 12, 12],
      [86, 20, 12, 12],
    ],
  },
  {
    id: 'tk-settle',
    tx: 0,
    ty: 36,
    body: [
      [26, 0, 76, 58], // back to ponder
      [4, 34, 22, 20],
      [98, 16, 18, 22],
      [30, 58, 16, 16],
      [82, 58, 16, 16],
    ],
    eyes: EYES_UP,
  },
];
const THINKING_PARTICLES: readonly RigAccent[] = [
  { rect: [108, 4, 5, 5], fill: INK, cls: 'octo-rig__accent--blink' },
  { rect: [116, 0, 4, 4], fill: INK, cls: 'octo-rig__accent--blink octo-rig__accent--delay1' },
  { rect: [122, 6, 3, 3], fill: INK, cls: 'octo-rig__accent--blink octo-rig__accent--delay2' },
  { rect: [4, 8, 4, 4], fill: CREAM, cls: 'octo-rig__accent--float' },
  { rect: [14, 4, 3, 3], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay1' },
  { rect: [120, 18, 3, 3], fill: SKY, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay2' },
  { rect: [2, 18, 3, 3], fill: SKY, cls: 'octo-rig__accent--twinkle' },
];

// --- Sleeping — body settles/breathes slowly with Zzz (5 frames) --------------
const SLEEPING_FRAMES: readonly RigFrame[] = [
  {
    id: 'sl-rest',
    tx: 0,
    ty: 38,
    body: [
      [24, 2, 80, 56], // torso settled
      [6, 38, 20, 18], // arms at sides relaxed
      [102, 38, 20, 18],
      [30, 58, 16, 14], // legs tucked
      [82, 58, 16, 14],
    ],
    eyes: EYES_CLOSED,
  },
  {
    id: 'sl-deep',
    tx: 0,
    ty: 40,
    body: [
      [26, 4, 76, 54], // torso sinks
      [8, 40, 18, 16], // arms droop
      [102, 40, 18, 16],
      [32, 58, 14, 12],
      [82, 58, 14, 12],
    ],
    eyes: EYES_CLOSED,
  },
  {
    id: 'sl-breathe',
    tx: 0,
    ty: 38,
    body: [
      [22, 2, 84, 58], // torso expands (breath)
      [4, 36, 20, 20], // arms pushed out
      [104, 36, 20, 20],
      [28, 60, 16, 14],
      [84, 60, 16, 14],
    ],
    eyes: EYES_CLOSED,
  },
  {
    id: 'sl-exhale',
    tx: 0,
    ty: 40,
    body: [
      [26, 4, 76, 54], // contracts again
      [8, 40, 18, 16],
      [102, 40, 18, 16],
      [32, 58, 14, 12],
      [82, 58, 14, 12],
    ],
    eyes: EYES_CLOSED,
  },
  {
    id: 'sl-settle',
    tx: 0,
    ty: 39,
    body: [
      [24, 3, 80, 56], // neutral rest
      [6, 38, 20, 18],
      [102, 38, 20, 18],
      [30, 58, 16, 14],
      [82, 58, 16, 14],
    ],
    eyes: EYES_CLOSED,
  },
];
const SLEEPING_PARTICLES: readonly RigAccent[] = [
  { rect: [100, 8, 8, 8], fill: INK, cls: 'octo-rig__accent--rise' },
  { rect: [110, 2, 7, 7], fill: INK, cls: 'octo-rig__accent--rise octo-rig__accent--delay1' },
  { rect: [118, 0, 6, 6], fill: INK, cls: 'octo-rig__accent--rise octo-rig__accent--delay2' },
  { rect: [4, 16, 3, 3], fill: CREAM, cls: 'octo-rig__accent--float' },
  { rect: [12, 10, 3, 3], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay2' },
  { rect: [120, 20, 3, 3], fill: CREAM, cls: 'octo-rig__accent--float octo-rig__accent--delay1' },
];

// --- Loving — body hugs/expands with hearts floating up (5 frames) ------------
const LOVING_FRAMES: readonly RigFrame[] = [
  {
    id: 'lv-open',
    tx: 0,
    ty: 36,
    body: [
      [26, 0, 76, 58], // torso
      [2, 28, 24, 22], // arms open wide
      [102, 28, 24, 22],
      [30, 58, 16, 16], // legs
      [82, 58, 16, 16],
    ],
    eyes: EYES_OPEN,
  },
  {
    id: 'lv-reach',
    tx: 0,
    ty: 34,
    body: [
      [24, 0, 80, 56], // torso widens
      [0, 22, 26, 24], // arms reaching out
      [102, 22, 26, 24],
      [28, 56, 18, 18],
      [82, 56, 18, 18],
    ],
    eyes: [
      [32, 23, 12, 12],
      [84, 23, 12, 12],
    ],
  },
  {
    id: 'lv-hug',
    tx: 0,
    ty: 32,
    body: [
      [20, 0, 88, 60], // torso biggest (hugging)
      [8, 20, 20, 26], // arms wrapping in
      [100, 20, 20, 26],
      [26, 60, 18, 18],
      [84, 60, 18, 18],
    ],
    eyes: EYES_CLOSED,
  },
  {
    id: 'lv-squeeze',
    tx: 0,
    ty: 30,
    body: [
      [22, 0, 84, 62], // torso pulsing
      [12, 24, 18, 24], // arms tighter
      [98, 24, 18, 24],
      [28, 62, 18, 16],
      [82, 62, 18, 16],
    ],
    eyes: EYES_CLOSED,
  },
  {
    id: 'lv-release',
    tx: 0,
    ty: 34,
    body: [
      [26, 0, 76, 58], // back to open
      [4, 28, 22, 22],
      [102, 28, 22, 22],
      [30, 58, 16, 16],
      [82, 58, 16, 16],
    ],
    eyes: [
      [32, 23, 12, 12],
      [84, 23, 12, 12],
    ],
  },
];
const LOVING_PARTICLES: readonly RigAccent[] = [
  ...heart(14, 4, 'octo-rig__accent--rise'),
  ...heart(100, 0, 'octo-rig__accent--rise octo-rig__accent--delay1'),
  ...heart(56, 0, 'octo-rig__accent--rise octo-rig__accent--delay2'),
  ...heart(6, 18, 'octo-rig__accent--float'),
  ...heart(112, 14, 'octo-rig__accent--float octo-rig__accent--delay1'),
  { rect: [40, 4, 3, 3], fill: PINK, cls: 'octo-rig__accent--twinkle' },
  { rect: [88, 4, 3, 3], fill: PINK, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay1' },
];

// --- Typing — fast finger tapping at keyboard (3 frames) ----------------------
const TYPING_FRAMES: readonly RigFrame[] = [
  {
    id: 'tp-left',
    tx: -1,
    ty: 36,
    body: [
      [28, 0, 72, 52],
      [6, 38, 24, 18],
      [98, 42, 22, 16],
      [34, 52, 16, 16],
      [78, 52, 16, 16],
    ],
    eyes: [
      [38, 16, 10, 8],
      [80, 16, 10, 8],
    ],
    props: keyboard(),
  },
  {
    id: 'tp-right',
    tx: 1,
    ty: 34,
    body: [
      [28, 0, 72, 54],
      [10, 42, 22, 16],
      [96, 38, 24, 18],
      [34, 54, 16, 14],
      [78, 54, 16, 14],
    ],
    eyes: [
      [38, 16, 10, 8],
      [80, 16, 10, 8],
    ],
    props: keyboard(),
  },
  {
    id: 'tp-both',
    tx: 0,
    ty: 34,
    body: [
      [26, 0, 76, 54],
      [6, 38, 24, 18],
      [98, 38, 24, 18],
      [32, 54, 16, 16],
      [80, 54, 16, 16],
    ],
    eyes: [
      [36, 16, 10, 8],
      [82, 16, 10, 8],
    ],
    props: keyboard(),
  },
];
const TYPING_ACCENTS: readonly RigAccent[] = [
  { rect: [36, 66, 3, 4], fill: GREEN, cls: 'octo-rig__accent--blink' },
  { rect: [56, 66, 3, 4], fill: GREEN, cls: 'octo-rig__accent--blink octo-rig__accent--delay1' },
  { rect: [76, 66, 3, 4], fill: GREEN, cls: 'octo-rig__accent--blink octo-rig__accent--delay2' },
  { rect: [46, 64, 2, 3], fill: CREAM, cls: 'octo-rig__accent--blink octo-rig__accent--delay2' },
  { rect: [66, 64, 2, 3], fill: CREAM, cls: 'octo-rig__accent--blink octo-rig__accent--delay1' },
  { rect: [110, 4, 4, 4], fill: GOLD, cls: 'octo-rig__accent--twinkle' },
  { rect: [12, 8, 3, 3], fill: SKY, cls: 'octo-rig__accent--twinkle octo-rig__accent--delay1' },
];

const HAND_POSES: Readonly<Record<string, RigPose>> = {
  idle: {
    frames: [{ id: 'idle', tx: 0, ty: 36, body: STAND_BODY, eyes: [] }],
  },
  alive: {
    frames: ALIVE_FRAMES,
    loopMs: 1100,
    accents: ALIVE_PARTICLES,
  },
  working: {
    frames: WORKING_FRAMES,
    loopMs: 460,
    accents: WORKING_PARTICLES,
  },
  thinking: {
    frames: THINKING_FRAMES,
    loopMs: 1400,
    accents: THINKING_PARTICLES,
  },
  sleeping: {
    frames: SLEEPING_FRAMES,
    loopMs: 2200,
    accents: SLEEPING_PARTICLES,
  },
  loving: {
    frames: LOVING_FRAMES,
    loopMs: 1000,
    accents: LOVING_PARTICLES,
  },
  celebrating: {
    frames: CONFETTI_JUMP,
    loopMs: 750,
    accents: CONFETTI_ACCENTS,
  },
  dancing: {
    frames: DANCE_FRAMES,
    loopMs: 700,
    accents: DANCE_NOTES,
  },
  typing: {
    frames: TYPING_FRAMES,
    loopMs: 500,
    accents: TYPING_ACCENTS,
  },
  debugging: {
    frames: DEBUG_FRAMES,
    loopMs: 1200,
    accents: DEBUG_PARTICLES,
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
    accents: EUREKA_SPARKLES,
  },
  walking: {
    frames: WALK_FRAMES,
    loopMs: 800,
    accents: WALK_DUST,
  },
  weights: {
    frames: WEIGHTS_FRAMES,
    loopMs: 1000,
    accents: WEIGHTS_EFFORT,
  },
  'flag-wave': {
    frames: FLAG_FRAMES,
    loopMs: 900,
    accents: FLAG_BREEZE,
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
