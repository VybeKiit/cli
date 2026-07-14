/**
 * Doctor pipeline — collect check adapters, run them, fold exit code.
 *
 * Each verify step is a {@link DoctorCheckAdapter}; the orchestrator no longer
 * owns free-floating side effects without a shared interface.
 */

/** One doctor readiness / verify step. */
export type DoctorCheckAdapter = {
  /** Stable id for logs and tests. */
  readonly id: string;
  /** Run the check; return whether it passes. */
  readonly run: () => boolean | Promise<boolean>;
  /** When true, a failing check forces non-zero exit. */
  readonly blocksExit: boolean;
  /** Optional human-readable lines for the doctor report. */
  readonly lines?: () => readonly string[];
};

/** Result of running the doctor pipeline fold. */
export type DoctorPipelineResult = {
  readonly exitCode: number;
  readonly results: ReadonlyArray<{
    readonly id: string;
    readonly ok: boolean;
    readonly blocksExit: boolean;
  }>;
};

/**
 * Run check adapters and fold an exit code.
 *
 * Steps:
 * 1. Run each adapter (order preserved).
 * 2. Record pass/fail.
 * 3. Exit 1 if any blocking check failed; else 0.
 *
 * @param checks - Ordered check adapters.
 * @returns Exit code and per-check results.
 * @example
 * const result = await runDoctorPipeline([{ id: 'gh', run: () => true, blocksExit: true }]);
 */
export const runDoctorPipeline = async (
  checks: readonly DoctorCheckAdapter[],
): Promise<DoctorPipelineResult> => {
  const results: Array<{
    readonly id: string;
    readonly ok: boolean;
    readonly blocksExit: boolean;
  }> = [];

  for (const check of checks) {
    const ok = await check.run();
    results.push({ id: check.id, ok, blocksExit: check.blocksExit });
  }

  const blocked = results.some((result) => result.blocksExit && !result.ok);
  return {
    exitCode: blocked ? 1 : 0,
    results,
  };
};

/**
 * Map classic readiness booleans into blocking check adapters (compat with planDoctorRun).
 *
 * @param input - Named readiness flags.
 * @returns Check adapters for {@link runDoctorPipeline}.
 * @example
 * const checks = readinessToChecks({ cloudReady: true, r2Ok: true, ... });
 */
export const readinessToChecks = (input: {
  readonly cloudReady: boolean;
  readonly r2Ok: boolean;
  readonly agentReady: boolean;
  readonly skillsReady: boolean;
  readonly projectHealthOk: boolean;
  readonly mobilePublishOk?: boolean;
}): readonly DoctorCheckAdapter[] => {
  const mobileOk = input.mobilePublishOk === undefined ? true : input.mobilePublishOk;
  return [
    { id: 'cloud', run: () => input.cloudReady, blocksExit: true },
    { id: 'r2', run: () => input.r2Ok, blocksExit: true },
    { id: 'agent', run: () => input.agentReady, blocksExit: true },
    { id: 'skills', run: () => input.skillsReady, blocksExit: true },
    { id: 'projectHealth', run: () => input.projectHealthOk, blocksExit: true },
    { id: 'mobilePublish', run: () => mobileOk, blocksExit: true },
  ];
};
