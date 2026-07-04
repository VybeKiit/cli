'use client';

import { ClaudeOctopusScene } from '@/components/builder-assistant-mark/ClaudeOctopusScene';
import { claudeOctopusScene } from '@/components/builder-assistant-mark/claudeOctopusScenes';

export function MascotSceneDemo({ scene }: { readonly scene: string }) {
  const meta = claudeOctopusScene(scene);

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 bg-muted/20 p-8">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border/70 shadow-sm">
        <ClaudeOctopusScene canvas="wide" scene={scene} />
      </div>
      <p className="max-w-xs text-center font-medium text-sm">{meta?.label ?? scene}</p>
      <p className="max-w-sm text-center text-muted-foreground text-xs leading-snug">
        {meta?.description}
      </p>
    </div>
  );
}
