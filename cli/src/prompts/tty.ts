/** True when stdin/stdout are TTY — interactive prompts are safe. */
export function isInteractive(): boolean {
  return Boolean(process.stdout.isTTY && process.stdin.isTTY);
}
