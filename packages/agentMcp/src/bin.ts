#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

/**
 * Start the single VybeKiit agent MCP server over stdio.
 *
 * @returns A promise that resolves when the server is connected.
 * @example
 * await main();
 */
const main = async (): Promise<void> => {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

/**
 * Convert an unknown fatal error into stderr output and exit.
 *
 * @param error - Unknown error from main.
 * @returns Never.
 * @example
 * main().catch(reportFatalError);
 */
const reportFatalError = (error: unknown): never => {
  let message = String(error);
  if (error instanceof Error) {
    message = error.stack === undefined ? error.message : error.stack;
  }
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

main().catch(reportFatalError);
