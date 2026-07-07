import { CLAUDE_OCTOPUS_EXTENDED_POSES_BATCH_2 } from './claudeOctopusExtendedPosesBatch2';

/** Data-driven poses — glyph overlay + shared animation variant. */
export type ClaudeOctopusAnimVariant =
  | 'bounce'
  | 'wobble'
  | 'pulse'
  | 'spin'
  | 'sway'
  | 'shake'
  | 'float'
  | 'tilt';

export interface ClaudeOctopusExtendedPose {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly glyph: string;
  readonly anim: ClaudeOctopusAnimVariant;
  readonly closedEyes?: boolean;
  readonly squintEyes?: boolean;
  readonly droopyEyes?: boolean;
  readonly customEyes?: boolean;
  readonly glow?:
    | 'active'
    | 'working'
    | 'sad'
    | 'celebrate'
    | 'love'
    | 'vibe'
    | 'panic'
    | 'deploy'
    | 'sleep';
}

const CLAUDE_OCTOPUS_EXTENDED_POSES_BATCH_1 = [
  {
    id: 'brainstorming',
    label: 'Brainstorming',
    description: 'Lightbulb shower — whiteboard full, ideas infinite.',
    glyph: '💡',
    anim: 'bounce',
  },
  {
    id: 'whiteboarding',
    label: 'Whiteboarding',
    description: 'Marker squeak — architecture diagram before code.',
    glyph: '📋',
    anim: 'sway',
  },
  {
    id: 'pairing',
    label: 'Pair programming',
    description: 'Two keyboards — driver/navigator swap in 25 minutes.',
    glyph: '👥',
    anim: 'wobble',
  },
  {
    id: 'mobbing',
    label: 'Mobbing',
    description: 'Whole squad on one bug — popcorn prompts only.',
    glyph: '🧑‍💻',
    anim: 'pulse',
  },
  {
    id: 'refactoring',
    label: 'Refactoring',
    description: 'Wrench twist — same behavior, fewer regrets.',
    glyph: '🔧',
    anim: 'tilt',
  },
  {
    id: 'optimizing',
    label: 'Optimizing',
    description: 'Lightning shave — 200ms down to 20, chef kiss.',
    glyph: '⚡',
    anim: 'shake',
  },
  {
    id: 'benchmarking',
    label: 'Benchmarking',
    description: 'Bar chart climb — numbers go brr before ship.',
    glyph: '📊',
    anim: 'float',
  },
  {
    id: 'profiling',
    label: 'Profiling',
    description: 'Microscope stare — who allocated all this?',
    glyph: '🔬',
    anim: 'tilt',
  },
  {
    id: 'logging',
    label: 'Logging',
    description: 'Scroll of truth — console.log archaeology.',
    glyph: '📝',
    anim: 'bounce',
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    description: 'Radar ping — dashboards green, soul uncertain.',
    glyph: '📡',
    anim: 'pulse',
  },
  {
    id: 'alerting',
    label: 'Alerting',
    description: 'Siren emoji — PagerDuty said hello at 3am.',
    glyph: '🚨',
    anim: 'shake',
    glow: 'panic',
  },
  {
    id: 'oncall',
    label: 'On-call',
    description: 'Phone buzz — you are the chosen gremlin tonight.',
    glyph: '📞',
    anim: 'wobble',
    glow: 'panic',
  },
  {
    id: 'paging',
    label: 'Paging',
    description: 'Pager flip — severity: yes.',
    glyph: '📟',
    anim: 'shake',
    glow: 'panic',
  },
  {
    id: 'incident',
    label: 'Incident',
    description: 'Ambulance dash — war room link in Slack pinned.',
    glyph: '🚑',
    anim: 'spin',
    glow: 'panic',
  },
  {
    id: 'postmortem',
    label: 'Postmortem',
    description: 'Blameless autopsy — five whys and a doc.',
    glyph: '📋',
    anim: 'sway',
  },
  {
    id: 'documenting',
    label: 'Documenting',
    description: 'Stack of docs — future you sends thanks.',
    glyph: '📚',
    anim: 'float',
  },
  {
    id: 'readme',
    label: 'README',
    description: 'Sacred scroll — install steps that actually work.',
    glyph: '📖',
    anim: 'bounce',
  },
  {
    id: 'changelog',
    label: 'Changelog',
    description: 'Patch notes poetry — fixed stuff, broke other stuff.',
    glyph: '📜',
    anim: 'sway',
  },
  {
    id: 'versioning',
    label: 'Versioning',
    description: 'Tag slap — semver bump, pray for minors.',
    glyph: '🏷️',
    anim: 'pulse',
  },
  {
    id: 'tagging',
    label: 'Tagging',
    description: 'Release tag — v2.0.0 because vibes.',
    glyph: '🔖',
    anim: 'tilt',
  },
  {
    id: 'rebasing',
    label: 'Rebasing',
    description: 'Branch yoga — history rewritten, courage tested.',
    glyph: '🌿',
    anim: 'wobble',
  },
  {
    id: 'cherrypicking',
    label: 'Cherry-pick',
    description: 'One commit, one hope — hotfix onto main.',
    glyph: '🍒',
    anim: 'bounce',
  },
  {
    id: 'stashing',
    label: 'Stashing',
    description: 'WIP box — save for later, forget forever.',
    glyph: '📦',
    anim: 'sway',
  },
  {
    id: 'cloning',
    label: 'Cloning',
    description: 'DNA spiral — fresh repo, same trauma.',
    glyph: '🧬',
    anim: 'pulse',
  },
  {
    id: 'forking',
    label: 'Forking',
    description: 'Fork lift — upstream drift begins now.',
    glyph: '🍴',
    anim: 'tilt',
  },
  {
    id: 'starring',
    label: 'Starring',
    description: 'GitHub star — social proof acquired.',
    glyph: '⭐',
    anim: 'float',
    glow: 'celebrate',
  },
  {
    id: 'linting',
    label: 'Linting',
    description: 'Sparkle sweep — semicolons judged silently.',
    glyph: '✨',
    anim: 'shake',
  },
  {
    id: 'formatting',
    label: 'Formatting',
    description: 'Prettier snap — tabs vs spaces war ends.',
    glyph: '🎯',
    anim: 'bounce',
  },
  {
    id: 'testing',
    label: 'Testing',
    description: 'Test tube swirl — red green red green…',
    glyph: '🧪',
    anim: 'wobble',
  },
  {
    id: 'fuzzing',
    label: 'Fuzzing',
    description: 'Dice roll — random input, chaotic truth.',
    glyph: '🎲',
    anim: 'spin',
  },
  {
    id: 'mocking',
    label: 'Mocking',
    description: 'Theater masks — fake API, real confidence.',
    glyph: '🎭',
    anim: 'pulse',
  },
  {
    id: 'seeding',
    label: 'Seeding',
    description: 'Sprout pop — demo data for local gods.',
    glyph: '🌱',
    anim: 'float',
  },
  {
    id: 'migrating',
    label: 'Migrating',
    description: 'Moving truck — schema change with baggage.',
    glyph: '🚚',
    anim: 'sway',
  },
  {
    id: 'rollback',
    label: 'Rollback',
    description: 'Reverse gear — prod was better five minutes ago.',
    glyph: '⏪',
    anim: 'tilt',
    glow: 'panic',
  },
  {
    id: 'canarying',
    label: 'Canarying',
    description: 'Baby bird deploy — 5% of users, 100% anxiety.',
    glyph: '🐤',
    anim: 'bounce',
    glow: 'deploy',
  },
  {
    id: 'bluegreen',
    label: 'Blue-green',
    description: 'Two worlds — flip traffic like a coin.',
    glyph: '💚',
    anim: 'pulse',
    glow: 'deploy',
  },
  {
    id: 'flagging',
    label: 'Feature flag',
    description: 'Flag wave — ship dark, enable when brave.',
    glyph: '🚩',
    anim: 'wobble',
  },
  {
    id: 'darkmode',
    label: 'Dark mode',
    description: 'Moon glow — eyes saved, contrast debated.',
    glyph: '🌙',
    anim: 'float',
  },
  {
    id: 'abtesting',
    label: 'A/B testing',
    description: 'Split brain — which button converts souls?',
    glyph: '🅰️',
    anim: 'shake',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Chart go up — metric validated, causality unknown.',
    glyph: '📈',
    anim: 'pulse',
    glow: 'celebrate',
  },
  {
    id: 'funneling',
    label: 'Funneling',
    description: 'Pour drip — signup to paid, leaky bucket.',
    glyph: '🫗',
    anim: 'sway',
  },
  {
    id: 'churning',
    label: 'Churning',
    description: 'Spiral out — users left, chart sad.',
    glyph: '🌀',
    anim: 'spin',
    glow: 'sad',
    droopyEyes: true,
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    description: 'Backpack bounce — welcome tour, skip button hidden.',
    glyph: '🎒',
    anim: 'bounce',
    glow: 'active',
  },
  {
    id: 'offboarding',
    label: 'Offboarding',
    description: 'Wave bye — export data, delete account, cry.',
    glyph: '👋',
    anim: 'sway',
  },
  {
    id: 'retiring',
    label: 'Retiring',
    description: 'Beach chair — legacy service sunset party.',
    glyph: '🏖️',
    anim: 'float',
    glow: 'sleep',
  },
  {
    id: 'interviewing',
    label: 'Interviewing',
    description: 'Mic check — leetcode but make it system design.',
    glyph: '🎤',
    anim: 'tilt',
  },
  {
    id: 'hiring',
    label: 'Hiring',
    description: 'Handshake — offer letter, equity dreams.',
    glyph: '🤝',
    anim: 'pulse',
    glow: 'celebrate',
  },
  {
    id: 'standup',
    label: 'Standup',
    description: 'Vertical sync — blocked, blocked, still blocked.',
    glyph: '🧍',
    anim: 'wobble',
  },
  {
    id: 'retro',
    label: 'Retro',
    description: 'Crystal ball — what went well, what went prod.',
    glyph: '🔮',
    anim: 'sway',
  },
  {
    id: 'slacking',
    label: 'Slacking',
    description: 'Chat bubble — thread that should have been a doc.',
    glyph: '💬',
    anim: 'bounce',
  },
] as const;

export const CLAUDE_OCTOPUS_EXTENDED_POSES = [
  ...(CLAUDE_OCTOPUS_EXTENDED_POSES_BATCH_1 as readonly ClaudeOctopusExtendedPose[]),
  ...(CLAUDE_OCTOPUS_EXTENDED_POSES_BATCH_2 as readonly ClaudeOctopusExtendedPose[]),
] as const;

export type ClaudeOctopusExtendedPoseId = (typeof CLAUDE_OCTOPUS_EXTENDED_POSES)[number]['id'];

const extendedById = new Map<string, ClaudeOctopusExtendedPose>(
  (CLAUDE_OCTOPUS_EXTENDED_POSES as readonly ClaudeOctopusExtendedPose[]).map((pose) => [
    pose.id,
    pose,
  ]),
);

/**
 * Resolve an extended pose definition by id.
 *
 * @param id - Extended pose id.
 * @returns Pose definition, or undefined when the id is unknown.
 * @example
 * claudeOctopusExtendedPose('deploying');
 */
export const claudeOctopusExtendedPose = (id: string): ClaudeOctopusExtendedPose | undefined =>
  extendedById.get(id);

/**
 * Resolve the CSS animation class for an extended pose.
 *
 * @param id - Extended pose id.
 * @returns Animation class, or undefined when the id is unknown.
 * @example
 * claudeOctopusExtendedAnimClass('deploying');
 */
export const claudeOctopusExtendedAnimClass = (id: string): string | undefined => {
  const pose = extendedById.get(id);
  return pose ? `claude-octopus--anim-${pose.anim}` : undefined;
};

const GLOW_CLASS: Record<NonNullable<ClaudeOctopusExtendedPose['glow']>, string> = {
  active: 'builder-assistant-mark--active',
  working: 'builder-assistant-mark--working',
  sad: 'builder-assistant-mark--sad',
  celebrate: 'builder-assistant-mark--celebrate',
  love: 'builder-assistant-mark--love',
  vibe: 'builder-assistant-mark--vibe',
  panic: 'builder-assistant-mark--panic',
  deploy: 'builder-assistant-mark--deploy',
  sleep: 'builder-assistant-mark--sleep',
};

/**
 * Resolve the glow CSS class for an extended pose.
 *
 * @param id - Extended pose id.
 * @returns Glow class, or undefined when the pose has no glow.
 * @example
 * claudeOctopusExtendedGlowClass('celebrating');
 */
export const claudeOctopusExtendedGlowClass = (id: string): string | undefined => {
  const pose = extendedById.get(id);
  return pose?.glow ? GLOW_CLASS[pose.glow] : undefined;
};
