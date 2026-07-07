/**
 * Buyer-voice tooltip copy for Report Mode dock controls.
 */

export const REPORT_DOCK_TOOLTIPS = {
  brandChip: 'Open or close this bar — hover to peek, click VybeKiit to pin it open or shut.',
  drag: 'Drag to move this bar anywhere on the screen.',
  pointAndFix: 'Turn on pick mode — click what looks wrong, then tell your agent.',
  pointAndFixActive: 'Pick mode is on — click the broken spot on the page.',
  position: 'Choose where this bar sits — hover a corner and hold 2 seconds.',
  handoffTrigger: 'Where your note goes — this chat or a fresh one.',
  handoffCurrentChat: 'Paste the report into the chat you already have open.',
  handoffNewChat: 'Open a new chat with the report ready to send.',
  highlightColor: "Color of the box around what you're pointing at.",
  off: 'Turn off pick mode.',
} as const;

/**
 * REPORT_TUTORIAL_STEPS value.
 */
export const REPORT_TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Your feedback bar',
    body: 'This bar helps you tell your agent what looks wrong on your preview.',
  },
  {
    id: 'report',
    title: 'Point & fix',
    body: 'Click here to turn on pick mode — or press Option+Shift+R.',
  },
  {
    id: 'inspect',
    title: 'Click and describe',
    body: 'Click the broken spot on the page, type what looks wrong, then hit Send.',
  },
  {
    id: 'settings',
    title: 'Position & chat',
    body: 'Move this bar to a corner or pick where your note goes — hold 2 seconds to lock a choice.',
  },
] as const;

export type ReportTutorialStepId = (typeof REPORT_TUTORIAL_STEPS)[number]['id'];
