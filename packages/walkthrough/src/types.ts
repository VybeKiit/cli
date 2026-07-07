/** One step of a first-run walkthrough. */
export type WalkthroughStep = {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  /** Optional CSS selector for the element this step points at. Undefined = a centered, anchorless step. */
  readonly target?: string;
};
