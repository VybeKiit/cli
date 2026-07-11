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
    title: 'Pick your agent',
    body: 'Choose Claude, Codex, Cursor, or another installed agent. The name in the bar is who you are talking to.',
    target: '[data-walkthrough="switch-agent"]',
  },
  {
    id: 'resume',
    title: 'Resume past chats',
    body: 'Open Resume to see every conversation for the agent you picked — including chats from other project folders on your computer (Claude Code is usually the longest list). Each row shows a small folder path so you know which project it belongs to. Pick one and keep going from here.',
    target: '[data-walkthrough="resume"]',
  },
  {
    id: 'upload',
    title: 'Attach files & images',
    body: 'Add screenshots or docs. Images show up in the chat so you can point at exactly what you mean.',
    target: '[data-walkthrough="upload"]',
  },
  {
    id: 'send',
    title: 'Send your message',
    body: 'Hit send to hand your note and any attachments straight to your agent.',
    target: '[data-walkthrough="send"]',
  },
  {
    id: 'production-note',
    title: 'Only you see this',
    body: 'This chat and the agent names are building tools. People who visit your live site never see any of this.',
    target: '[data-walkthrough="privacy-notice"]',
  },
];
