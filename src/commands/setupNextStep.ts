import { accessHelpLines, isAccessProblem } from '../doctor/accessHelp';
import type { GateReason } from '../doctor/gate';

/** Inputs for the setup honest next-step matrix. */
export type SetupNextStepInput = {
  readonly doctorExitCode: number;
  readonly gateReason: GateReason;
  /**
   * Absolute path of the Session #1 web app when first install already created one.
   * When set, setup does not tell the buyer to create another app.
   */
  readonly firstAppPath?: string;
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
      'Some tools still need attention. Fix the items marked above, then run:',
      '  npx vybekiit setup',
      '',
    ];
  }

  if (isAccessProblem(input.gateReason)) {
    return [...accessHelpLines(input.gateReason), ''];
  }

  if (input.firstAppPath !== undefined && input.firstAppPath !== '') {
    return ['Your app is ready at:', `  ${input.firstAppPath}`, ''];
  }

  return [
    'Next: create your app',
    '  npx vybekiit create app --web',
    '  (or --mobile / --extension)',
    '',
  ];
};
