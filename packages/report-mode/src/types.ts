/** Supported AI assistant runtimes for Report Mode deeplink handoff. */
export type VybeAssistant = 'cursor' | 'claude' | 'codex';

/** Which template surface produced the report. */
export type ReportPlatform = 'web' | 'mobile' | 'extension';

/** Structured payload captured when a vibe coder reports a broken UI element. */
export interface ReportPayload {
  readonly route: string;
  readonly selector: string;
  readonly spotLabel?: string;
  readonly a11yName?: string;
  readonly visibleText?: string;
  readonly consoleErrors: readonly string[];
  readonly builderNote: string;
  readonly platform?: ReportPlatform;
}

/** Ring buffer for recent console errors (browser or RN dev). */
export class ConsoleErrorBuffer {
  private readonly max: number;
  private readonly errors: string[] = [];

  constructor(max = 3) {
    this.max = max;
  }

  push(message: string): void {
    this.errors.push(message);
    while (this.errors.length > this.max) {
      this.errors.shift();
    }
  }

  snapshot(): readonly string[] {
    return [...this.errors];
  }

  clear(): void {
    this.errors.length = 0;
  }
}

/** Default hotkey label shown in dev overlay banners. */
export const REPORT_MODE_HOTKEY_LABEL = 'Option+Shift+R (Alt+Shift+R on Windows/Linux)';

/** Magic prefix the agent layer recognizes in doctor handoff. */
export const REPORT_PROMPT_PREFIX = '[VybeKiit Report]';
