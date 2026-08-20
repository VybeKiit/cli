import process from 'node:process';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from '@vybekiit/agent-mcp';

/** Serve the globally registered VybeKiit tool catalog over stdio. */
export const runMcpServer = async (): Promise<number> => {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  await new Promise<void>((complete) => {
    process.stdin.once('end', complete);
  });
  return 0;
};
