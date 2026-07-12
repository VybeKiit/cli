import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Express } from 'express';

/** A running loopback server plus helpers to address and stop it. */
export type Loopback = {
  /** Absolute URL for a path on the loopback server, e.g. `url('/health')`. */
  readonly url: (path: string) => string;
  /** Stop the server and resolve once the socket is fully closed. */
  readonly close: () => Promise<void>;
};

/**
 * Boot an Express app on an ephemeral loopback port for real-socket tests.
 *
 * Uses `listen(0)` so the OS assigns a free port; requests then travel through
 * the full middleware stack (helmet, cors, `/api` security, cookie-parser) over
 * TCP, exactly as production would — the dep-free e2e transport of ADR-0042.
 *
 * @param app - The Express application to serve.
 * @returns A {@link Loopback} handle bound to `127.0.0.1`.
 * @example
 * const loopback = await startLoopback(createApp());
 */
export const startLoopback = async (app: Express): Promise<Loopback> => {
  const server = await new Promise<Server>((resolve) => {
    const started = app.listen(0, '127.0.0.1', () => resolve(started));
  });
  const { port } = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}`;

  return {
    url: (path) => `${base}${path}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error === undefined ? resolve() : reject(error)));
      }),
  };
};

/**
 * Extract one cookie's `name=value` pair from a response's `Set-Cookie` headers.
 *
 * Node's `fetch` keeps no cookie jar, so tests echo the session cookie back by
 * hand; this reads it from a sign-in response for the follow-up request.
 *
 * @param response - Fetch response that may carry `Set-Cookie` headers.
 * @param name - Cookie name to look for, e.g. `vk_session`.
 * @returns The `name=value` pair to send as a `Cookie` header, or undefined.
 * @example
 * const cookie = cookieFrom(signInResponse, 'vk_session');
 */
export const cookieFrom = (response: Response, name: string): string | undefined => {
  for (const raw of response.headers.getSetCookie()) {
    const [pair] = raw.split(';');
    if (pair?.startsWith(`${name}=`)) {
      return pair;
    }
  }
};
