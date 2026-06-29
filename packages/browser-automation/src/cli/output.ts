export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function printError(message: string, json: boolean): void {
  if (json) {
    printJson({ ok: false, error: message });
  } else {
    process.stderr.write(`[vybekiit-automate] ${message}\n`);
  }
}
