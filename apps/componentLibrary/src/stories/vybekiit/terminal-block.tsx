'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { TerminalBlock } from '@vybekiit/ui/terminal-block';

const INIT_LINES = [
  'npx vybekiit init my-app',
  '  ✔ Cloning starter kit…',
  '  ✔ Installing dependencies (pnpm)…',
  '  ✔ Configuring Neon database…',
  '  ✔ Setting up Cloudflare Workers…',
  '  ✔ Done! cd my-app && pnpm dev',
];

const DEPLOY_LINES = [
  'pnpm run deploy',
  '  Building edge functions…',
  '  Uploading assets to R2…',
  '  Deployed → https://my-app.vybekiit.workers.dev',
];

/** TerminalBlock in dark (default) and transparent variants with realistic CLI output. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col gap-6 w-full max-w-lg">
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs">Dark (default)</span>
        <TerminalBlock title="vybekiit init" lines={INIT_LINES} variant="dark" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-medium text-muted-foreground text-xs">Transparent</span>
        <TerminalBlock title="deploy" lines={DEPLOY_LINES} variant="transparent" />
      </div>
    </div>
  ),
};

export default story;
