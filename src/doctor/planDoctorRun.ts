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
  /**
   * Claude Code global install (managed skills + /vybekiit + CLAUDE.md block).
   * When omitted, treated as pass so unit tests that only care about other gates stay green.
   */
  readonly globalClaudeOk?: boolean;
};

/**
 * Compute the doctor process exit code from readiness checks.
 *
 * Exit non-zero when any blocking gate fails. Optional gates (mobile publish, Claude
 * global install) default to pass when omitted — non-mobile / non-Claude hosts.
 *
 * @param input - Boolean readiness checks collected by the doctor runner.
 * @returns Zero when every gate passes, otherwise one.
 * @example
 * const code = computeDoctorExitCode({ cloudReady: true, r2Ok: true, agentReady: true, skillsReady: true, projectHealthOk: true });
 */
export const computeDoctorExitCode = (input: DoctorReadinessInput): number => {
  const gates: readonly boolean[] = [
    input.cloudReady,
    input.r2Ok,
    input.agentReady,
    input.skillsReady,
    input.projectHealthOk,
    input.mobilePublishOk ?? true,
    input.globalClaudeOk ?? true,
  ];
  return gates.every((ok) => ok) ? 0 : 1;
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
