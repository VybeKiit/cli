'use client';

import { BuilderAssistantMark } from './BuilderAssistantMark';

/** Claude octopus at a cute mini macOS-style terminal — vibe coder desk setup. */
export default function ClaudeOctopusMacosDesk() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-8">
      <div className="claude-macos-desk w-full overflow-hidden rounded-xl border border-border/80 bg-[#1e1e1e] shadow-2xl">
        <div className="flex items-center gap-2 border-[#2d2d2d] border-b bg-[#282828] px-3 py-2">
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 font-medium text-[#a1a1a1] text-[10px]">
            Claude Code — vibe-session
          </span>
        </div>
        <div className="space-y-2 px-4 py-5 font-mono text-[#d4d4d4] text-xs leading-relaxed">
          <p>
            <span className="text-[#569CD6]">you</span>
            <span className="text-[#808080]"> › </span>
            ship the landing page with coral vibes ✨
          </p>
          <p className="flex items-start gap-2 text-[#CE9178]">
            <BuilderAssistantMark
              assistant="claude"
              className="mt-0.5 shrink-0"
              pose="working"
              size="xs"
            />
            <span>On it — wiring the hero, checkout, and one-shot deploy…</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <BuilderAssistantMark assistant="claude" pose="working" size="xxl" />
        <p className="text-center text-muted-foreground text-sm">
          Working pose inside a macOS-style terminal chrome
        </p>
      </div>
    </div>
  );
}
