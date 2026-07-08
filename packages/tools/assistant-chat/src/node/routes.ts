import type { IncomingMessage, ServerResponse } from 'node:http';

import type { VybeAssistant } from '@vybekiit/report-mode';

import { probeCapabilities, probeModels } from './models/probe';

const parseModelAssistant = (assistantParam: string | null): VybeAssistant | null => {
  if (assistantParam === 'claude' || assistantParam === 'codex' || assistantParam === 'cursor') {
    return assistantParam;
  }

  return null;
};

/**
 * Write the local assistant capability response.
 *
 * @param res - HTTP response to write.
 * @returns Nothing; the response is ended by this handler.
 * @example
 * handleCapabilitiesRequest(res);
 */
export const handleCapabilitiesRequest = (res: ServerResponse): void => {
  const body = JSON.stringify(probeCapabilities());
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(body);
};

/**
 * Write the model response for one assistant.
 *
 * @param assistantParam - Raw assistant query parameter.
 * @param res - HTTP response to write.
 * @returns A promise that resolves after the response is ended.
 * @example
 * await handleModelsRequest('codex', res);
 */
export const handleModelsRequest = async (
  assistantParam: string | null,
  res: ServerResponse,
): Promise<void> => {
  const assistant = parseModelAssistant(assistantParam);
  if (assistant === null) {
    res.writeHead(400).end('assistant must be claude, codex, or cursor');
    return;
  }
  const body = JSON.stringify(await probeModels(assistant));
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(body);
};

/**
 * Read the full JSON request body as text.
 *
 * @param req - Incoming HTTP request.
 * @returns A promise that succeeds with the raw request body.
 * @example
 * const body = await readJsonBody(req);
 */
export const readJsonBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
