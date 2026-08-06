import process from 'node:process';

/** Process-stream sink for doctor output (ADR-0036 — no `console`). */
export type DoctorLog = {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
};

/** Default doctor sink: stdout for progress, stderr for failures. */
export const processDoctorLog: DoctorLog = {
  log: (message) => {
    process.stdout.write(`${message}\n`);
  },
  error: (message) => {
    process.stderr.write(`${message}\n`);
  },
};

/** Write each line through the doctor sink as one stdout block. */
export const writeDoctorLines = (log: DoctorLog, lines: readonly string[]): void => {
  if (lines.length === 0) {
    return;
  }
  log.log(lines.join('\n'));
};
