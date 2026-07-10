import type { GateReason } from '../doctor/gate';

/** Inputs for the setup honest next-step matrix (ADR-0038). */
export type SetupNextStepInput = {
  readonly doctorExitCode: number;
  readonly gateReason: GateReason;
};

/**
 * Choose the single next action after setup (doctor + access probe).
 *
 * @param input - Doctor exit code and gate reason.
 * @returns Plain-language next-step lines for the buyer.
 * @example
 * const lines = formatSetupNextStep({ doctorExitCode: 0, gateReason: 'ok' });
 */
export const formatSetupNextStep = (input: SetupNextStepInput): readonly string[] => {
  if (input.doctorExitCode !== 0) {
    return [
      'Tools still need attention — fix the items marked above, then run:',
      '  vybekiit setup',
      '',
    ];
  }

  if (input.gateReason === 'gh-missing') {
    return [
      'GitHub CLI is missing. Fix the doctor items above (install gh), then run:',
      '  vybekiit setup',
      '',
    ];
  }

  if (input.gateReason === 'gh-unauthed') {
    return [
      "You're not signed in to GitHub yet. Run:",
      '  gh auth login --web',
      'Then run: vybekiit setup',
      '',
    ];
  }

  if (input.gateReason === 'no-access') {
    return [
      "We couldn't find VybeKiit access for your GitHub account.",
      'Purchase at https://vybekiit.com (invite is automatic after checkout),',
      'or sign in as the GitHub account you bought with (`gh auth status`), then run setup again.',
      '',
    ];
  }

  return [
    'Next: create your app',
    '  vybekiit create app --web',
    '  (or --mobile / --extension)',
    '',
  ];
};
