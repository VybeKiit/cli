import { cancel, intro, isCancel, outro, select } from '@clack/prompts';
import type { TemplateName } from '../lib/scaffold';

const TEMPLATE_OPTIONS: { value: TemplateName; label: string; hint: string }[] = [
  { value: 'web', label: 'Web app (Next.js)', hint: 'Marketing site + dashboard + API' },
  { value: 'spa', label: 'Admin app (React SPA)', hint: 'Vite dashboard, pairs with backend' },
  { value: 'mobile', label: 'Mobile app', hint: 'Expo' },
  { value: 'extension', label: 'Browser extension', hint: 'WXT' },
  { value: 'backend', label: 'Backend API', hint: 'Express for mobile/extension/spa' },
];

/**
 * Pick a starter template with `@clack/prompts`.
 *
 * @returns The selected template name, or null when the prompt is cancelled.
 * @example
 * const template = await promptTemplateSelect();
 */
export const promptTemplateSelect = async (): Promise<TemplateName | null> => {
  intro('VybeKiit — pick a starting template');
  const picked = await select({
    message: 'What are you building?',
    options: TEMPLATE_OPTIONS.map(({ value, label, hint }) => ({
      value,
      label,
      hint,
    })),
  });
  if (isCancel(picked)) {
    cancel('Cancelled.');
    return null;
  }
  outro('Great — scaffolding next.');
  return picked as TemplateName;
};
