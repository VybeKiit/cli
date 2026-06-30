import type { ToolReport } from './toolchain';

/** Inputs to the pure doctor readiness policy — test surface for exit codes. */
export interface DoctorReadinessInput {
  readonly cloudReady: boolean;
  readonly r2Ok: boolean;
  readonly agentReady: boolean;
  readonly skillsReady: boolean;
  readonly projectHealthOk: boolean;
}

/** Exit code policy: 0 when every gate passes, 1 otherwise. */
export function computeDoctorExitCode(input: DoctorReadinessInput): number {
  const ready =
    input.cloudReady &&
    input.r2Ok &&
    input.agentReady &&
    input.skillsReady &&
    input.projectHealthOk;
  return ready ? 0 : 1;
}

/** Injectable seams for the side-effecting doctor executor. */
export interface DoctorDeps {
  readonly spawn: (
    command: string,
    args: readonly string[],
    options: { stdio: 'ignore' | 'inherit' },
  ) => { status: number | null; error?: Error };
}

export function reportFor(reports: readonly ToolReport[], name: string): ToolReport | undefined {
  return reports.find((r) => r.tool === name);
}
