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
 * Doctor process exit code from readiness checks.
 * Exit non-zero when any blocking gate fails. Optional gates (mobile publish, Claude
 * global install) default to pass when omitted — non-mobile / non-Claude hosts.
 */
export const computeDoctorExitCode = (readiness: DoctorReadinessInput): number => {
  const gates: readonly boolean[] = [
    readiness.cloudReady,
    readiness.r2Ok,
    readiness.agentReady,
    readiness.skillsReady,
    readiness.projectHealthOk,
    readiness.mobilePublishOk ?? true,
    readiness.globalClaudeOk ?? true,
  ];
  return gates.every((gatePassed) => gatePassed) ? 0 : 1;
};

/** Doctor report for one tool executable name, if that tool was checked. */
export const reportFor = (
  reports: readonly ToolReport[],
  toolName: string,
): ToolReport | undefined => reports.find((report) => report.tool === toolName);
