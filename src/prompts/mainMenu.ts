import { cancel, intro, isCancel, select } from '@clack/prompts';

/** Buyer-tier menu choices for bare `vybekiit` (ADR-0038). */
export type MainMenuChoice = 'setup' | 'create' | 'doctor' | 'add-piece' | 'help-all';

/**
 * Open the buyer main menu and return the chosen action.
 *
 * @returns Selected action, or null when cancelled.
 * @example
 * const choice = await promptMainMenu();
 */
export const promptMainMenu = async (): Promise<MainMenuChoice | null> => {
  intro('Welcome to VybeKiit');
  const picked = await select({
    message: 'What do you want to do?',
    options: [
      {
        value: 'setup',
        label: 'Set up my tools (first time)',
        hint: 'Install helpers your app needs',
      },
      {
        value: 'create',
        label: 'Create an app',
        hint: 'Web, mobile, or extension',
      },
      {
        value: 'add-piece',
        label: 'Add a ready piece',
        hint: 'Page recipe, database preset, catalog',
      },
      {
        value: 'doctor',
        label: 'Check my tools',
        hint: 'Full toolchain pass',
      },
      {
        value: 'help-all',
        label: 'More commands…',
        hint: 'Full command list',
      },
    ],
  });

  if (isCancel(picked) || typeof picked !== 'string') {
    cancel('Cancelled.');
    return null;
  }

  if (
    picked === 'setup' ||
    picked === 'create' ||
    picked === 'doctor' ||
    picked === 'add-piece' ||
    picked === 'help-all'
  ) {
    return picked;
  }

  return null;
};
