# syntax=docker/dockerfile:1

# ---- deps -------------------------------------------------------------
# Installs workspace dependencies for @nevis/api and its workspace deps
# (@nevis/shared) using a frozen lockfile, without copying any source.
FROM node:22-alpine AS deps
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --filter @nevis/api...

# ---- build --------------------------------------------------------------
# Copies sources for the api and its shared workspace dep, then builds
# shared before api (tsc project references / workspace dep resolution).
FROM deps AS build
COPY packages/shared/tsconfig*.json packages/shared/
COPY packages/shared/src packages/shared/src
COPY apps/api/tsconfig*.json apps/api/
COPY apps/api/src apps/api/src
COPY apps/api/data apps/api/data
COPY tsconfig.base.json ./

RUN pnpm --filter @nevis/shared build && pnpm --filter @nevis/api build

# Produce a self-contained, pruned production directory (dist + prod deps,
# including workspace deps like @nevis/shared) for the runtime stage.
# `pnpm deploy` copies only the files listed in apps/api/package.json's
# "files" field (["dist"]) into the deploy output, so that field exists to
# keep source (src/, tsconfig*.json, etc.) out of the deployed package.
RUN pnpm --filter @nevis/api deploy --prod --legacy /deploy/api

# ---- runtime --------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /deploy/api ./
# The dataset is resolved at runtime relative to dist/ (see src/data.ts:
# `dirname(dist/data.js)/../data`), i.e. a `data/` directory that is a
# sibling of `dist/` at the package root. Reproduce that sibling layout here.
COPY --from=build /repo/apps/api/data ./data

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "dist/server.js"]
