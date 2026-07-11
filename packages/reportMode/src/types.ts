/** Supported AI assistant runtimes for Report Mode deeplink handoff and dev chat. */
export type VybeAssistant = 'cursor' | 'claude' | 'codex' | 'kiro' | 'kimi' | 'devin' | 'grok';

/** Canonical ordered list of assistant ids (switchers, probes, validation). */
export const VYBE_ASSISTANTS: readonly VybeAssistant[] = [
  'claude',
  'codex',
  'cursor',
  'kiro',
  'kimi',
  'devin',
  'grok',
] as const;

/**
 * Type guard for a VybeAssistant id string.
 *
 * @param value - Candidate id.
 * @returns True when the value is a known assistant.
 * @example
 * isVybeAssistantId('claude'); // true
 */
export const isVybeAssistantId = (value: string): value is VybeAssistant =>
  (VYBE_ASSISTANTS as readonly string[]).includes(value);

/** Which template surface produced the report. */
export type ReportPlatform = 'web' | 'mobile' | 'extension';

/** Structured payload captured when a vibe coder reports a broken UI element. */
export type ReportPayload = {
  readonly route: string;
  readonly selector: string;
  readonly spotLabel?: string;
  readonly a11yName?: string;
  readonly visibleText?: string;
  readonly consoleErrors: readonly string[];
  readonly builderNote: string;
  readonly platform?: ReportPlatform;
};

/** Ring buffer for recent console errors (browser or RN dev). */
export class ConsoleErrorBuffer {
  private readonly max: number;
  private readonly errors: string[] = [];

  /**
   * Create a bounded console error buffer.
   *
   * @param max - Maximum number of messages to retain.
   * @example
   * const buffer = new ConsoleErrorBuffer(3);
   */
  constructor(max = 3) {
    this.max = max;
  }

  /**
   * Add one console error message to the buffer.
   *
   * @param message - Error message to retain.
   * @returns Nothing.
   * @example
   * buffer.push('TypeError: failed');
   */
  push(message: string): void {
    this.errors.push(message);
    while (this.errors.length > this.max) {
      this.errors.shift();
    }
  }

  /**
   * Read the current buffered errors.
   *
   * @returns A readonly snapshot of retained error messages.
   * @example
   * const errors = buffer.snapshot();
   */
  snapshot(): readonly string[] {
    return [...this.errors];
  }

  /**
   * Clear all retained console errors.
   *
   * @returns Nothing.
   * @example
   * buffer.clear();
   */
  clear(): void {
    this.errors.length = 0;
  }
}

/** Default hotkey label shown in dev overlay banners. */
export const REPORT_MODE_HOTKEY_LABEL = 'Option+Shift+R (Alt+Shift+R on Windows/Linux)';

/** Magic prefix the agent layer recognizes in doctor handoff. */
export const REPORT_PROMPT_PREFIX = '[VybeKiit Report]';
