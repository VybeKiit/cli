FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

WORKDIR /workspace
COPY . .

RUN pnpm install --frozen-lockfile \
  && pnpm --filter @vybekiit/core build \
  && cd cli && pnpm test nativeToolchain.test.ts

COPY docker/dev-verify/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3002
ENTRYPOINT ["/entrypoint.sh"]
