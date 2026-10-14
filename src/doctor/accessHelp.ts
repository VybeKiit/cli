import { GITHUB_SIGN_IN_COMMAND } from './toolDeclarations';

export type AccessProblem = 'gh-missing' | 'gh-unauthed' | 'no-access';

const ACCESS_HELP: Readonly<Record<AccessProblem, readonly string[]>> = {
  'gh-missing': [
    'VybeKiit needs the GitHub CLI to check your access. Install it with:',
    '  npx vybekiit setup',
    'Then run this again.',
  ],
  'gh-unauthed': [
    'Sign in to GitHub with the account you used at checkout:',
    `  ${GITHUB_SIGN_IN_COMMAND}`,
    'Then run this again.',
  ],
  'no-access': [
    'Your GitHub account does not have VybeKiit access yet.',
    'Check your email for the invite from GitHub, or email info@vybekiit.com for help.',
    'Used a different GitHub account at checkout? Sign in with it:',
    `  ${GITHUB_SIGN_IN_COMMAND}`,
    'Then run this again.',
  ],
};

export const isAccessProblem = (reason: string): reason is AccessProblem =>
  Object.hasOwn(ACCESS_HELP, reason);

export const accessHelpLines = (problem: AccessProblem): readonly string[] => ACCESS_HELP[problem];
