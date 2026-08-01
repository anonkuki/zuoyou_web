FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json eslint.config.mjs ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile
COPY apps ./apps
COPY packages ./packages
RUN pnpm build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3100 DATABASE_PATH=/app/data/guild.sqlite UPLOAD_ROOT=/app/data/uploads WEB_ROOT=/app/apps/web/dist
WORKDIR /app
RUN corepack enable && useradd --create-home --uid 10001 guild && mkdir -p /app/data && chown -R guild:guild /app
COPY --from=build --chown=guild:guild /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build --chown=guild:guild /app/node_modules ./node_modules
COPY --from=build --chown=guild:guild /app/apps/api ./apps/api
COPY --from=build --chown=guild:guild /app/apps/web/dist ./apps/web/dist
COPY --from=build --chown=guild:guild /app/packages/contracts ./packages/contracts
USER guild
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3100/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "apps/api/dist/server.js"]
