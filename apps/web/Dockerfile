# syntax=docker/dockerfile:1

# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
# apps/api/package.json is copied even though this image only builds
# @nevis/web: pnpm-lock.yaml is a single lockfile for the whole workspace,
# so `pnpm install --frozen-lockfile` needs every workspace package.json
# present to verify the lockfile is still consistent with them.
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile --filter @nevis/web...

COPY tsconfig.base.json ./
COPY packages/shared/tsconfig*.json packages/shared/
COPY packages/shared/src packages/shared/src
COPY apps/web ./apps/web

RUN pnpm --filter @nevis/shared build && pnpm --filter @nevis/web build

# ---- runtime ----------------------------------------------------------------
FROM nginx:alpine AS runtime

COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
