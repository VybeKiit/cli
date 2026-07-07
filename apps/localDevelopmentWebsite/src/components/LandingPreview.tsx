'use client';

import { Button } from '@vybekiit/ui';
import { motion } from 'framer-motion';
import { ExternalLink, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

type LandingPreviewProps = {
  title?: string;
  compact?: boolean;
};

/**
 * Render the landing preview component.
 *
 * @param title - Product title displayed in the generated preview.
 * @param compact - Whether to render the smaller embedded preview.
 * @returns A React element for the local dev Console UI.
 * @example
 * const element = <LandingPreview title="Acme" compact={true} />;
 */
export const LandingPreview = ({ title = 'Your SaaS', compact = false }: LandingPreviewProps) => {
  const [expanded, setExpanded] = useState(false);

  const openFull = useCallback(() => {
    const html = generateLandingHtml(title);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [title]);

  const maxHeightClass = compact ? 'max-h-[160px]' : 'max-h-[280px]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-zinc-950 overflow-hidden',
        compact ? 'mt-3' : 'mt-6',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between border-b border-emerald-500/20',
          compact ? 'px-3 py-2' : 'px-5 py-3',
        )}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h3 className={cn('font-semibold text-emerald-300', compact ? 'text-sm' : 'text-base')}>
            Preview — {title}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={openFull}
          className="gap-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open full
        </Button>
      </div>

      <button
        type="button"
        className={cn(
          'block w-full cursor-pointer text-left transition-all',
          expanded ? 'max-h-[600px]' : maxHeightClass,
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="relative">
          <div className="scale-[0.6] origin-top-left w-[166.67%]">
            <div
              className="bg-zinc-950 text-zinc-100 p-8"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: preview only
              dangerouslySetInnerHTML={{ __html: generateLandingBody(title) }}
            />
          </div>
          {!expanded && (
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
          )}
        </div>
      </button>

      {!expanded && (
        <p className="px-4 pb-3 text-xs text-zinc-500 text-center">
          Click to expand • Open full to see it in a browser tab
        </p>
      )}
    </motion.div>
  );
};

const generateLandingBody = (title: string) => `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto;">
  <nav style="display: flex; justify-content: space-between; align-items: center; padding: 24px 0; border-bottom: 1px solid #27272a;">
    <span style="font-weight: 700; font-size: 20px; color: #a78bfa;">${title}</span>
    <div style="display: flex; gap: 16px;">
      <a style="color: #a1a1aa; text-decoration: none; font-size: 14px;">Features</a>
      <a style="color: #a1a1aa; text-decoration: none; font-size: 14px;">Pricing</a>
      <a style="background: #7c3aed; color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 14px;">Get Started</a>
    </div>
  </nav>

  <section style="text-align: center; padding: 80px 0 60px;">
    <h1 style="font-size: 48px; font-weight: 800; line-height: 1.1; margin-bottom: 24px;">
      Ship your <span style="color: #a78bfa;">SaaS</span> in one session
    </h1>
    <p style="font-size: 18px; color: #a1a1aa; max-width: 500px; margin: 0 auto 32px;">
      From idea to live product — auth, payments, dashboard, and deploy. All handled by your AI agent.
    </p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <a style="background: #7c3aed; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600;">Start building →</a>
      <a style="border: 1px solid #3f3f46; color: #e4e4e7; padding: 12px 24px; border-radius: 10px; text-decoration: none;">Watch demo</a>
    </div>
  </section>

  <section style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 40px 0;">
    <div style="border: 1px solid #27272a; border-radius: 12px; padding: 24px;">
      <div style="width: 40px; height: 40px; background: #7c3aed20; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 20px;">🔒</div>
      <h3 style="font-weight: 600; margin-bottom: 8px;">Authentication</h3>
      <p style="color: #71717a; font-size: 14px;">Email, Google OAuth, and magic links out of the box.</p>
    </div>
    <div style="border: 1px solid #27272a; border-radius: 12px; padding: 24px;">
      <div style="width: 40px; height: 40px; background: #7c3aed20; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 20px;">💳</div>
      <h3 style="font-weight: 600; margin-bottom: 8px;">Payments</h3>
      <p style="color: #71717a; font-size: 14px;">Stripe checkout, subscriptions, and customer portal.</p>
    </div>
    <div style="border: 1px solid #27272a; border-radius: 12px; padding: 24px;">
      <div style="width: 40px; height: 40px; background: #7c3aed20; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 20px;">🚀</div>
      <h3 style="font-weight: 600; margin-bottom: 8px;">One-click deploy</h3>
      <p style="color: #71717a; font-size: 14px;">Goes live on Cloudflare Workers in seconds.</p>
    </div>
  </section>

  <section style="text-align: center; padding: 60px 0; border-top: 1px solid #27272a;">
    <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 16px;">Ready to ship?</h2>
    <p style="color: #a1a1aa; margin-bottom: 24px;">Join the waitlist for early access.</p>
    <div style="display: flex; gap: 8px; justify-content: center; max-width: 400px; margin: 0 auto;">
      <input placeholder="you@email.com" style="flex: 1; background: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 10px 16px; color: white; font-size: 14px;" />
      <button style="background: #7c3aed; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer;">Join</button>
    </div>
  </section>
</div>
`;

const generateLandingHtml = (title: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #09090b; color: #fafafa; min-height: 100vh; }
    a { cursor: pointer; }
    a:hover { opacity: 0.85; }
    button:hover { opacity: 0.9; }
    input:focus { outline: none; border-color: #7c3aed; }
  </style>
</head>
<body>
  ${generateLandingBody(title)}
</body>
</html>`;
