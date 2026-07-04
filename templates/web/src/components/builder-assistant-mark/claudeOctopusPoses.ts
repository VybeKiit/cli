import {
  CLAUDE_OCTOPUS_EXTENDED_POSES,
  type ClaudeOctopusExtendedPoseId,
} from './claudeOctopusExtendedPoses';

/** Core poses with hand-authored SVG overlays. */
export type ClaudeOctopusCorePose =
  | 'idle'
  | 'alive'
  | 'working'
  | 'sad'
  | 'sleeping'
  | 'dancing'
  | 'singing'
  | 'celebrating'
  | 'thinking'
  | 'coffee'
  | 'debugging'
  | 'vibing'
  | 'panicking'
  | 'loving'
  | 'deploying'
  | 'eureka'
  | 'tired'
  | 'prompting'
  | 'merging'
  | 'reviewing'
  | 'waiting'
  | 'broke'
  | 'rich'
  | 'summoning'
  | 'hotfix'
  | 'facepalm'
  | 'micdrop'
  | 'manifesting'
  | 'unhinged'
  | 'snacking'
  | 'typing'
  | 'scrolling'
  | 'rubberduck'
  | 'gaming'
  | 'streaking'
  | 'hoarding'
  | 'preaching'
  | 'nesting'
  | 'ghosting'
  | 'flexing'
  | 'meditating'
  | 'rewinding';

/** All named animation states — core hand-crafted + data-driven extended set. */
export type ClaudeOctopusPose = ClaudeOctopusCorePose | ClaudeOctopusExtendedPoseId;

const CORE_POSES: ReadonlyArray<{
  id: ClaudeOctopusCorePose;
  label: string;
  description: string;
}> = [
  { id: 'idle', label: 'Idle', description: 'Silhouette only — waiting for the next prompt.' },
  { id: 'alive', label: 'Alive', description: 'Hop and wink — assistant is online and ready.' },
  { id: 'working', label: 'Working', description: 'Fast bounce while the agent types or thinks.' },
  {
    id: 'prompting',
    label: 'Prompting',
    description: 'Cursor blink — vibe coder is writing the magic words.',
  },
  {
    id: 'thinking',
    label: 'Thinking',
    description: 'Slow tilt with thought dots — hmm, let me vibe on that…',
  },
  {
    id: 'manifesting',
    label: 'Manifesting',
    description: 'Eyes closed, stars rising — it will compile, trust.',
  },
  {
    id: 'summoning',
    label: 'Summoning',
    description: 'Sparkle swirl — invoking the agent with one epic prompt.',
  },
  {
    id: 'debugging',
    label: 'Debugging',
    description: 'Squint and magnifier — something broke at 2am.',
  },
  {
    id: 'reviewing',
    label: 'Code review',
    description: 'Reading glasses — squinting at the diff before merge.',
  },
  {
    id: 'merging',
    label: 'Merging',
    description: 'Branch tug-of-war — git merge in progress, hold my coffee.',
  },
  { id: 'eureka', label: 'Eureka', description: 'Lightbulb pop — it finally compiled.' },
  {
    id: 'celebrating',
    label: 'Shipped it',
    description: 'Victory bounce and confetti — PR merged, users happy.',
  },
  {
    id: 'micdrop',
    label: 'Mic drop',
    description: 'Dropped mic — shipped with zero follow-up tickets.',
  },
  {
    id: 'rich',
    label: 'First sale',
    description: 'Floating dollars — Stripe ping hit while you were vibing.',
  },
  { id: 'dancing', label: 'Dancing', description: 'Groove loop — green CI never felt so good.' },
  {
    id: 'singing',
    label: 'Singing',
    description: 'Open mouth and notes — humming through the deploy.',
  },
  { id: 'vibing', label: 'Vibing', description: 'Shades on, chill sway — flow state unlocked.' },
  {
    id: 'loving',
    label: 'In love',
    description: 'Floating hearts — the agent nailed it first try.',
  },
  {
    id: 'coffee',
    label: 'Coffee mode',
    description: 'Mug wobble — powered by espresso and prompts.',
  },
  {
    id: 'snacking',
    label: 'Snack break',
    description: 'Chip bag rustle — build runs, human refuels.',
  },
  {
    id: 'typing',
    label: 'Typing',
    description: 'Keyboard blur — fingers flying through the prompt.',
  },
  {
    id: 'scrolling',
    label: 'Doomscrolling',
    description: 'Thumb flick — reading docs until the answer appears.',
  },
  {
    id: 'rubberduck',
    label: 'Rubber duck',
    description: 'Explaining the bug out loud to a yellow friend.',
  },
  { id: 'gaming', label: 'Gaming', description: 'Controller wobble — CI runs, one more level.' },
  {
    id: 'streaking',
    label: 'Commit streak',
    description: 'Flame trail — green builds day after day.',
  },
  {
    id: 'hoarding',
    label: 'Tab hoarder',
    description: 'Stacked windows — research mode, probably.',
  },
  { id: 'preaching', label: 'Preaching', description: 'Megaphone blast — “works on my machine.”' },
  { id: 'nesting', label: 'Deep nest', description: 'Cozy blanket — headphones on, world off.' },
  { id: 'ghosting', label: 'Ghosted', description: 'Fading outline — CI skipped your PR again.' },
  { id: 'flexing', label: 'Flexing', description: 'Muscle pop — shipped the refactor solo.' },
  {
    id: 'meditating',
    label: 'Meditating',
    description: 'Calm halo — breathe before the prod deploy.',
  },
  {
    id: 'rewinding',
    label: 'Rewinding',
    description: 'Undo swirl — git revert at terminal velocity.',
  },
  {
    id: 'deploying',
    label: 'Deploying',
    description: 'Rocket lift-off — pushing to prod, fingers crossed.',
  },
  { id: 'hotfix', label: 'Hotfix', description: 'Flames and urgency — prod fire, patch incoming.' },
  {
    id: 'waiting',
    label: 'Waiting on CI',
    description: 'Foot tap and clock — pipeline slower than inspiration.',
  },
  {
    id: 'panicking',
    label: 'Panic',
    description: 'Shake and sweat — prod is down, Slack is loud.',
  },
  {
    id: 'broke',
    label: 'It broke',
    description: 'Cracked shell and X eyes — build red, vibes temporarily paused.',
  },
  {
    id: 'unhinged',
    label: 'Unhinged',
    description: 'Wild spin — too many tabs, one more feature.',
  },
  {
    id: 'facepalm',
    label: 'Facepalm',
    description: 'Palm to face — forgot a semicolon in prod config.',
  },
  {
    id: 'tired',
    label: 'Burned out',
    description: 'Heavy lids — one more fix before sleep, probably.',
  },
  {
    id: 'sleeping',
    label: 'Sleeping',
    description: 'Closed eyes and Zzz — laptop closed, agent idle.',
  },
  {
    id: 'sad',
    label: 'Sad',
    description: 'Droopy lids, frown, tears — tests failed or scope creep.',
  },
] as const;

export const CLAUDE_OCTOPUS_POSES: ReadonlyArray<{
  id: ClaudeOctopusPose;
  label: string;
  description: string;
}> = [
  ...CORE_POSES,
  ...CLAUDE_OCTOPUS_EXTENDED_POSES.map(({ id, label, description }) => ({
    id: id as ClaudeOctopusPose,
    label,
    description,
  })),
];

export type AssistantMood = 'default' | 'sad';

/** Map legacy boolean props to an explicit pose (prefer `pose` when both are set). */
export function resolveClaudeOctopusPose(options: {
  pose?: ClaudeOctopusPose;
  active?: boolean;
  working?: boolean;
  mood?: AssistantMood;
}): ClaudeOctopusPose {
  if (options.pose) {
    return options.pose;
  }
  if (options.mood === 'sad') {
    return 'sad';
  }
  if (options.working && options.active) {
    return 'working';
  }
  if (options.active) {
    return 'alive';
  }
  return 'idle';
}

/** Catalog slug for a pose demo card (`claude-octopus-{slug}`). */
export function claudeOctopusPoseDemoName(pose: ClaudeOctopusPose): string {
  return `claude-octopus-${pose}`;
}

export const CLAUDE_OCTOPUS_POSE_IDS: readonly ClaudeOctopusPose[] = CLAUDE_OCTOPUS_POSES.map(
  (item) => item.id,
);
