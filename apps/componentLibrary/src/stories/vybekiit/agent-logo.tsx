'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { AGENT_BRAND_COLORS, AgentLogo } from '@vybekiit/ui/agent-logo';

const SLUGS = ['kiro', 'claude-code', 'cursor', 'gemini', 'codex'] as const;
const SLUG_LABELS: Record<(typeof SLUGS)[number], string> = {
  kiro: 'Kiro',
  'claude-code': 'Claude Code',
  cursor: 'Cursor',
  gemini: 'Gemini',
  codex: 'Codex',
};
const SIZES = [16, 24, 36] as const;

/** AgentLogo for all 5 slugs at default size, plus size variants for one slug. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">All agents (size 32)</span>
        <div className="flex items-center gap-8">
          {SLUGS.map((slug) => (
            <div key={slug} className="flex flex-col items-center gap-2">
              <div
                className="flex items-center justify-center rounded-xl p-2"
                style={{ backgroundColor: `${AGENT_BRAND_COLORS[slug]}22` }}
              >
                <AgentLogo slug={slug} size={32} />
              </div>
              <span className="font-medium text-muted-foreground text-xs">{SLUG_LABELS[slug]}</span>
              <span className="font-mono text-xs" style={{ color: AGENT_BRAND_COLORS[slug] }}>
                {AGENT_BRAND_COLORS[slug]}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="font-medium text-muted-foreground text-xs">Size prop — Claude Code</span>
        <div className="flex items-end gap-8">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <AgentLogo slug="claude-code" size={size} />
              <span className="font-medium text-muted-foreground text-xs">{size}px</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export default story;
