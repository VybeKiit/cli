# Platform wrapper: AWS (Agent Toolkit + existing adapters)

**Agent-only.** Supports `@vybekiit/db` (`DATA_PROVIDER=aws` DynamoDB) and `@vybekiit/deploy` AWS hosting.

## Official upstream

- Agent Toolkit skills: https://docs.aws.amazon.com/agent-toolkit/latest/userguide/skills.html
- Install: `npx skills add aws/agent-toolkit-for-aws/skills`
- AWS MCP Server: authenticated API access + runtime skill retrieval

## Kit wiring

1. Data: `DATA_PROVIDER=aws` with `AWS_REGION` (+ optional keys or instance role)
2. Hosting: `HOSTING_PROVIDER=aws` with Amplify app id when provisioned
3. Skills assist console/API work the agent absorbs — builder never sees AWS console

## Verify-before-advance

- Ask: "What AWS skills do you have available?"
- Run `vybekiit doctor` — platform-skills report lists pinned AWS toolkit skills
- Local AWS credentials profile for MCP (never commit keys)

## Security

MCP uses the developer's local AWS profile only. No AWS secrets in the repo.
