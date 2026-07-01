/**
 * The single place the web template talks to its own API routes.
 * Implementation lives in @vybekiit/http/client; this file is the web origin seam.
 */
export { getJson, postJson } from '@vybekiit/http/client';
