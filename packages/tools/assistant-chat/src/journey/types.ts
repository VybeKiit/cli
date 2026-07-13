/**
 * Domain journey model for the assistant dual rail: a seeded multi-step path
 * (auth / database / payments / deploy) that advances when real (or fixture)
 * tool events arrive. Scripts seed labels; tool events own status.
 */

/** Supported high-level domains the UI has rich cards for. */
export type JourneyDomain = 'auth' | 'database' | 'payments' | 'deploy' | 'crud';

/** Lifecycle of one journey step. */
export type JourneyStepStatus = 'pending' | 'running' | 'done' | 'error';

/** One step on a domain journey. */
export type JourneyStep = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly status: JourneyStepStatus;
  /**
   * Substrings matched against tool_call names (case-insensitive).
   * First matching pending/running step advances when a tool event arrives.
   */
  readonly toolHints: readonly string[];
};

/** A seeded domain journey ready to render and advance. */
export type Journey = {
  readonly id: string;
  readonly domain: JourneyDomain;
  readonly title: string;
  /** Kit skill slug the agent should run (e.g. `sign-in-with-google`). */
  readonly skillIntent: string;
  /** Plain-language params extracted from the user message (provider, host, …). */
  readonly params: Readonly<Record<string, string>>;
  readonly steps: readonly JourneyStep[];
};

/** Phase of a tool event from the agent bridge (or fixture). */
export type ToolEventPhase = 'start' | 'end' | 'error';

/** Normalized tool event used to advance journey steps. */
export type JourneyToolEvent = {
  readonly name: string;
  readonly phase: ToolEventPhase;
  readonly detail?: string | undefined;
};
