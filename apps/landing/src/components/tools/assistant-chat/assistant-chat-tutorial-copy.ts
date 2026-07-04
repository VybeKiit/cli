import type { WalkthroughStep } from '@vybekiit/walkthrough';

/**
 * First-run coach-marks for the dev assistant panel. The final step reassures the vibe-coder that
 * this dev-only tooling — and the agent names — never reach the people who use their live product.
 */
export const ASSISTANT_TUTORIAL_STEPS: readonly WalkthroughStep[] = [
  {
    id: 'drag',
    title: 'Move it anywhere',
    body: 'Grab this handle to drag the panel. Let go near a screen edge and it snaps flush so it stays out of your way.',
    target: '[data-walkthrough="drag-handle"]',
  },
  {
    id: 'switch-agent',
    title: 'Switch your agent',
    body: 'Flip between Claude, Codex, and Cursor here — each one keeps its own chat and model choice.',
    target: '[data-walkthrough="switch-agent"]',
  },
  {
    id: 'upload',
    title: 'Attach files & images',
    body: 'Add screenshots, docs, or links. Images show up right in the chat so you can point at exactly what you mean.',
    target: '[data-walkthrough="upload"]',
  },
  {
    id: 'send',
    title: 'Send your message',
    body: 'Hit send to hand your note — and any attachments — straight to your agent.',
    target: '[data-walkthrough="send"]',
  },
  {
    id: 'production-note',
    title: 'This is just for building',
    body: 'Relax — this dev chat and the agent names (Claude / Codex / Cursor) are just your building tools. The people who use your live app or extension never see any of this.',
  },
];
