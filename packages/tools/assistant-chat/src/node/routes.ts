import type { IncomingMessage, ServerResponse } from 'node:http';

import type { VybeAssistant } from '@vybekiit/report-mode';

import { probeCapabilities, probeModels } from './models/probe';

export function handleCapabilitiesRequest(res: ServerResponse): void {
  const body = JSON.stringify(probeCapabilities());
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(body);
}

export async function handleModelsRequest(
  assistantParam: string | null,
  res: ServerResponse,
): Promise<void> {
  const assistant = assistantParam as VybeAssistant | null;
  if (assistant !== 'claude' && assistant !== 'codex' && assistant !== 'cursor') {
    res.writeHead(400).end('assistant must be claude, codex, or cursor');
    return;
  }
  const body = JSON.stringify(await probeModels(assistant));
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(body);
}

export function readJsonBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
