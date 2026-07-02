/**
 * The single place the web template talks to its own API routes.
 * Implementation lives in @vybekiit/core/http/client; this file is the web origin seam.
 */
export { getJson, postJson } from '@vybekiit/core/http/client';
