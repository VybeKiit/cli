import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SKILL_CONTENT = `# ai-browser-bridge

Drive ChatGPT, Gemini, Claude, DeepSeek, Grok, or Perplexity in a real browser from any agent, one provider or fanned out. Exposes sandboxed local repo tools to ChatGPT over MCP, and serves an outbound MCP \`ask\` tool so agents can call web chats natively.

## Prerequisites

- macOS
- Node.js ≥ 20, pnpm
- Google Chrome
- \`cloudflared\` (optional, for ChatGPT MCP tools)
- Signed-in providers: run \`bridge login --provider <name>\` once per provider

## Install & setup

\`\`\`bash
git clone https://github.com/YosefHayim/ai-browser-bridge.git
cd ai-browser-bridge
pnpm install && pnpm build
pnpm link --global   # makes \`bridge\` available globally
\`\`\`

## How to use as a tool

### MCP stdio (Claude Code, Kiro, any MCP client)

\`\`\`bash
bridge serve
\`\`\`

Exposes an \`ask\` tool over stdio: \`ask({ prompt, providers?, timeoutSeconds? })\`

### CLI (Codex, scripts, any shell-based agent)

\`\`\`bash
# One provider
bridge ask "summarize this repo" --provider chatgpt --json

# Fan out across multiple
bridge ask "compare approaches" --provider claude,deepseek,grok --json
\`\`\`

\`--json\` emits machine-readable output. Never hangs in a pipe.

## Per-agent setup

### Claude Code

\`\`\`bash
claude mcp add ai-browser-bridge -- bridge serve
\`\`\`

### Kiro

Add to your MCP config:
\`\`\`jsonc
{
  "mcpServers": {
    "ai-browser-bridge": { "command": "bridge", "args": ["serve"] }
  }
}
\`\`\`

### Cursor

Add to \`.cursor/mcp.json\`:
\`\`\`json
{
  "mcpServers": {
    "ai-browser-bridge": { "command": "bridge", "args": ["serve"] }
  }
}
\`\`\`

### Codex

Use the CLI directly in tool invocations:
\`\`\`bash
bridge ask "your question" --provider chatgpt --json
\`\`\`

## Available commands

| Command | Purpose |
|---------|---------|
| \`bridge\` (bare) | Interactive TUI |
| \`bridge ask <prompt>\` | One-shot send + reply |
| \`bridge login --provider <name>\` | Sign in once |
| \`bridge serve\` | Outbound MCP ask tool (stdio) |
| \`bridge providers\` | Show provider status + live instances |
| \`bridge download\` | Download conversation attachments |
| \`bridge sessions\` | List stored sessions |
| \`bridge stop\` | Kill warm Chrome |
| \`bridge project list\\|create\` | Manage ChatGPT Projects |
| \`bridge chat list\\|move\` | Organize conversations |
| \`bridge task list\\|create\` | Schedule ChatGPT Tasks |

## Constraints

- macOS only (hardcoded Chrome path, pbcopy/lsof)
- Each provider needs a one-time \`bridge login\`
- File operations are sandboxed to the target repo (no escape)
- No raw shell, only validated MCP tools
- Browser selectors may break when provider UIs update

## Fan-out behavior

- \`--provider a,b,c\` runs all in parallel
- Partial-failure tolerant: exits non-zero only when ALL fail
- \`--strict\`: exit non-zero if ANY fails
- Replies keyed by provider in JSON output
`;

const AGENT_SKILL_DIRS = [
  '.claude/skills',
  '.kiro/skills',
  '.cursor/skills',
  '.agents/skills',
] as const;

const SKILL_FILENAME = 'ai-browser-bridge.md';

/**
 * Install ai-browser-bridge and write agent skill wrappers into the current project.
 *
 * @param args - CLI arguments after `add bridge`.
 * @returns Process exit code for the command.
 * @example
 * const exitCode = runAddBridge(['--json']);
 */
export const runAddBridge = (args: string[]): number => {
  const cwd = process.cwd();
  const json = args.includes('--json');

  const results: string[] = [];

  // 1. Install ai-browser-bridge globally
  try {
    execFileSync('pnpm', ['add', '-g', 'ai-browser-bridge'], { stdio: 'pipe' });
    results.push('Installed ai-browser-bridge globally');
  } catch {
    // Already installed or pnpm not available for global, try npm.
    try {
      execFileSync('npm', ['install', '-g', 'ai-browser-bridge'], { stdio: 'pipe' });
      results.push('Installed ai-browser-bridge globally (via npm)');
    } catch {
      results.push('Could not install globally. Install manually: pnpm add -g ai-browser-bridge');
    }
  }

  // 2. Copy SKILL.md into all agent skill directories
  let skillsCopied = 0;
  for (const dir of AGENT_SKILL_DIRS) {
    const fullDir = join(cwd, dir);
    mkdirSync(fullDir, { recursive: true });
    writeFileSync(join(fullDir, SKILL_FILENAME), SKILL_CONTENT, 'utf8');
    skillsCopied++;
  }
  results.push(`Copied skill to ${skillsCopied} agent directories`);

  // 3. Add .bridge to .gitignore if not already present
  const gitignorePath = join(cwd, '.gitignore');
  let gitignoreContent = '';
  if (existsSync(gitignorePath)) {
    gitignoreContent = readFileSync(gitignorePath, 'utf8');
  }
  if (gitignoreContent.includes('.bridge')) {
    results.push('.bridge already in .gitignore');
  } else {
    const newline = gitignoreContent.endsWith('\n') ? '' : '\n';
    writeFileSync(gitignorePath, `${gitignoreContent}${newline}.bridge\n`, 'utf8');
    results.push('Added .bridge to .gitignore');
  }

  // 4. Output
  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: true, steps: results }, null, 2)}\n`);
  } else {
    process.stdout.write('\n');
    process.stdout.write('  🌉 ai-browser-bridge added\n');
    process.stdout.write('\n');
    for (const r of results) {
      process.stdout.write(`  ✓ ${r}\n`);
    }
    process.stdout.write('\n');
    process.stdout.write('  Next: run `bridge login --provider chatgpt` to sign in.\n');
    process.stdout.write('\n');
  }

  return 0;
};
