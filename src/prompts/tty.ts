/**
 * Check whether interactive prompts can safely read and write to the terminal.
 *
 * @returns True when both stdin and stdout are attached to a TTY.
 * @example
 * if (isInteractive()) await promptTemplateSelect();
 */
export const isInteractive = (): boolean => Boolean(process.stdout.isTTY && process.stdin.isTTY);
