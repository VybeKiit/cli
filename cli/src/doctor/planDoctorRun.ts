import type { ToolReport } from './toolchain';

/** Inputs to the pure doctor readiness policy — test surface for exit codes. */
export type DoctorReadinessInput = {
  readonly cloudReady: boolean;
  readonly r2Ok: boolean;
  readonly agentReady: boolean;
  readonly skillsReady: boolean;
  readonly projectHealthOk: boolean;
  /** When omitted, treated as pass (non-mobile projects). */
  readonly mobilePublishOk?: boolean;
};

/**
 * Compute the doctor process exit code from readiness checks.
 *
 * @param input - Boolean readiness checks collected by the doctor runner.
 * @returns Zero when every gate passes, otherwise one.
 * @example
 * const code = computeDoctorExitCode({ cloudReady: true, r2Ok: true, agentReady: true, skillsReady: true, projectHealthOk: true });
 */
export const computeDoctorExitCode = (input: DoctorReadinessInput): number => {
  const mobileOk = input.mobilePublishOk === undefined ? true : input.mobilePublishOk;
  const ready =
    input.cloudReady &&
    input.r2Ok &&
    input.agentReady &&
    input.skillsReady &&
    input.projectHealthOk &&
    mobileOk;
  return ready ? 0 : 1;
};

/** Injectable seams for the side-effecting doctor executor. */
export type DoctorDeps = {
  readonly spawn: (
    command: string,
    args: readonly string[],
    options: { stdio: 'ignore' | 'inherit' },
  ) => { status: number | null; error?: Error };
};

/**
 * Find one doctor report by tool name.
 *
 * @param reports - Tool reports produced by the doctor runner.
 * @param name - Tool executable name to find.
 * @returns Matching report, or undefined when the tool was not checked.
 * @example
 * const gh = reportFor(reports, 'gh');
 */
export const reportFor = (reports: readonly ToolReport[], name: string): ToolReport | undefined =>
  reports.find((r) => r.tool === name);
