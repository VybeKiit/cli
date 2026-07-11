# Maintainer-only multi-agent dogfood image (Claude / Codex / Grok).
# Not a buyer artifact. See docker/agent-eval/README.md.
FROM node:22-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    gnupg \
    jq \
    python3 \
    unzip \
    # Chromium deps for Playwright / browser-automation inside the kit
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# GitHub CLI (buyer gate + kit mirror clone)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      > /etc/apt/sources.list.d/github-cli.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends gh \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Agent CLIs — install globally; each compose service only *uses* one.
# Versions pin loosely; re-check headless flags when upgrading.
RUN npm install -g @anthropic-ai/claude-code@latest \
  && npm install -g @openai/codex@latest \
  || true

# Grok CLI package name may vary; try common names without failing the image build.
RUN npm install -g @xai/grok@latest 2>/dev/null \
  || npm install -g grok@latest 2>/dev/null \
  || true

WORKDIR /opt/agent-eval
COPY docker/agent-eval/entrypoint.sh /opt/agent-eval/entrypoint.sh
COPY docker/agent-eval/agents /opt/agent-eval/agents
COPY docker/agent-eval/mission /opt/agent-eval/mission
RUN chmod +x /opt/agent-eval/entrypoint.sh /opt/agent-eval/agents/*.sh

# Dogfood harness runs as root so bind-mounted host volumes are writable.
# Isolation is per-container + empty workspace, not multi-tenant security.
ENV HOME=/root
RUN mkdir -p /workspace /logs /artifacts /kit-source

WORKDIR /workspace
ENTRYPOINT ["/opt/agent-eval/entrypoint.sh"]
