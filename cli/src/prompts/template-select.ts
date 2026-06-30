import * as clack from '@clack/prompts';
import type { TemplateName } from '../lib/scaffold';

const TEMPLATE_OPTIONS: { value: TemplateName; label: string; hint: string }[] = [
  { value: 'web', label: 'Web app', hint: 'Next.js + dashboard' },
  { value: 'mobile', label: 'Mobile app', hint: 'Expo' },
  { value: 'extension', label: 'Browser extension', hint: 'WXT' },
  { value: 'backend', label: 'Backend API', hint: 'Express for mobile/extension' },
];

/** Pick a template with @clack/prompts (TTY only). */
export async function promptTemplateSelect(): Promise<TemplateName | null> {
  clack.intro('VybeKiit — pick a starting template');
  const picked = await clack.select({
    message: 'What are you building?',
    options: TEMPLATE_OPTIONS.map(({ value, label, hint }) => ({
      value,
      label,
      hint,
    })),
  });
  if (clack.isCancel(picked)) {
    clack.cancel('Cancelled.');
    return null;
  }
  clack.outro('Great — scaffolding next.');
  return picked as TemplateName;
}
