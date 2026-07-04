'use client';

import {
  ASSISTANT_LABELS,
  BuilderAssistantMark,
  BUILDER_ASSISTANT_MARK_SIZE_LABELS,
  BUILDER_ASSISTANT_MARK_SIZES,
  type BuilderAssistantMarkSize,
} from './BuilderAssistantMark';
import { CLAUDE_OCTOPUS_POSES, type ClaudeOctopusPose } from './claudeOctopusPoses';
import { ClaudeOctopusScene } from './ClaudeOctopusScene';
import { CLAUDE_OCTOPUS_SCENES } from './claudeOctopusScenes';
import { ClaudeOctopusJump } from './octopusRig';
import type { VybeAssistant } from '@vybekiit/report-mode';
import { cn } from '@/lib/utils';

const ASSISTANTS: readonly VybeAssistant[] = ['cursor', 'claude', 'codex'];

/** A diverse hand-picked sample of the sharp rig (the full set is in the grid below). */
const RIG_SAMPLE: readonly ClaudeOctopusPose[] = [
  'deploying',
  'debugging',
  'loving',
  'vibing',
  'based',
  'coffee',
  'cooked',
  'meditating',
  'panicking',
  'rich',
  'sad',
  'agentswarm',
];

function PoseCard({
  pose,
  className,
}: {
  readonly pose: ClaudeOctopusPose;
  readonly className?: string;
}) {
  const meta = CLAUDE_OCTOPUS_POSES.find((item) => item.id === pose);

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center',
        className,
      )}
    >
      <BuilderAssistantMark assistant="claude" pose={pose} size="l" />
      <div>
        <p className="font-semibold text-sm">{meta?.label ?? pose}</p>
        <p className="mt-1 line-clamp-2 text-muted-foreground text-xs leading-snug">
          {meta?.description}
        </p>
      </div>
      <code className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
        pose=&quot;{pose}&quot;
      </code>
    </div>
  );
}

/** Gallery grid — all Claude octopus poses, sizes, and builder marks. */
export default function BuilderAssistantMarkShowcase() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-6 md:p-10">
      <header className="space-y-2 text-center">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          VybeKiit · brand mascots
        </p>
        <h1 className="font-bold text-2xl tracking-tight">Builder assistant marks</h1>
        <p className="mx-auto max-w-xl text-muted-foreground text-sm">
          Cursor, Claude Code, and Codex marks — {CLAUDE_OCTOPUS_POSES.length} animated octopus
          poses and a six-step size scale from XS to XXL.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-lg">Sharp integer-grid rig</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-[10px] text-primary uppercase tracking-wide">
            New
          </span>
        </div>
        <p className="max-w-2xl text-muted-foreground text-sm">
          Rebuilt on the official Clawd grid — viewBox 129×113,{' '}
          <code>shape-rendering: crispEdges</code>, and a hard ~8fps frame-swap (no CSS sub-pixel
          tween). Every rect coordinate is a whole number, so edges land on exact device pixels at
          any size. All {CLAUDE_OCTOPUS_POSES.length} poses now render on the grid — each composed
          from shared body parts, an eye state, and a pixel-art prop. A sample below; the full set
          is in the grid.
        </p>
        <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="h-40 w-40 shrink-0 self-center p-2">
            <ClaudeOctopusJump />
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <p className="font-semibold text-sm">A sample of the sharp rig</p>
            <div className="flex flex-wrap gap-5">
              {RIG_SAMPLE.map((id) => (
                <div className="flex flex-col items-center gap-1.5" key={id}>
                  <BuilderAssistantMark assistant="claude" pose={id} size="xl" />
                  <code className="font-mono text-[10px] text-muted-foreground">{id}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Size scale</h2>
        <div className="flex flex-wrap items-end justify-center gap-6 rounded-xl border border-border bg-card p-6">
          {BUILDER_ASSISTANT_MARK_SIZES.map((size: BuilderAssistantMarkSize) => (
            <div className="flex flex-col items-center gap-2" key={size}>
              <BuilderAssistantMark assistant="claude" pose="alive" size={size} />
              <code className="font-mono text-[10px] text-muted-foreground">
                size=&quot;{size}&quot;
              </code>
              <span className="text-[10px] text-muted-foreground">
                {BUILDER_ASSISTANT_MARK_SIZE_LABELS[size]}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg">
          Claude Code octopus poses ({CLAUDE_OCTOPUS_POSES.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {CLAUDE_OCTOPUS_POSES.map((item) => (
            <PoseCard key={item.id} pose={item.id} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg">Deluxe scenes ({CLAUDE_OCTOPUS_SCENES.length})</h2>
        <p className="max-w-2xl text-muted-foreground text-sm">
          Full illustrated scenes — a real MacBook, an office chair, and a live confetti field. One
          illustration serves every crop via the <code>canvas</code> prop.
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CLAUDE_OCTOPUS_SCENES.map((scene) => (
            <div
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
              key={scene.id}
            >
              <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
                <ClaudeOctopusScene canvas="wide" scene={scene.id} />
              </div>
              <div>
                <p className="font-semibold text-sm">{scene.label}</p>
                <p className="mt-1 text-muted-foreground text-xs leading-snug">
                  {scene.description}
                </p>
              </div>
              <code className="w-fit rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                scene=&quot;{scene.id}&quot;
              </code>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-lg">All builder assistants</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {ASSISTANTS.map((assistant) => (
            <div
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center"
              key={assistant}
            >
              <BuilderAssistantMark
                active={assistant !== 'claude'}
                assistant={assistant}
                size="xl"
                {...(assistant === 'claude' ? { pose: 'alive' as const } : {})}
              />
              <p className="font-semibold text-sm">{ASSISTANT_LABELS[assistant]}</p>
              <code className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                assistant=&quot;{assistant}&quot;
              </code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
