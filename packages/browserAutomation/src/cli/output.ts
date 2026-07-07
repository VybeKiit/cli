/**
 * Print a JSON value to stdout with a trailing newline.
 *
 * @param value - Serializable value to print.
 * @returns Nothing; writes to stdout.
 * @example
 * printJson({ ok: true });
 */
export const printJson = (value: unknown): void => {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
};

/**
 * Print one text line to stdout.
 *
 * @param message - Text to print before the trailing newline.
 * @returns Nothing; writes to stdout.
 * @example
 * printLine('OK');
 */
export const printLine = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

/**
 * Print a CLI error in JSON or text mode.
 *
 * @param message - Error message to show.
 * @param json - Whether to emit a JSON error payload.
 * @returns Nothing; writes to stdout or stderr.
 * @example
 * printError('Missing --name', false);
 */
export const printError = (message: string, json: boolean): void => {
  if (json) {
    printJson({ ok: false, error: message });
  } else {
    process.stderr.write(`[vybekiit-automate] ${message}\n`);
  }
};
