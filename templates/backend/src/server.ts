import { createApp } from './app.js';

const defaultPort = 4000;

/**
 * Resolve the HTTP port from the optional environment value.
 *
 * @param value - Raw `PORT` value from the environment.
 * @returns Numeric port, falling back to the template default when absent or invalid.
 * @example
 * const port = resolvePort(process.env.PORT);
 */
const resolvePort = (value: string | undefined): number => {
  if (value === undefined || value.length === 0) {
    return defaultPort;
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return defaultPort;
};

const port = resolvePort(process.env.PORT);
const app = createApp();

app.listen(port, () => {
  process.stdout.write(`Backend listening on http://localhost:${port}\n`);
});
