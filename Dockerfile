FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
COPY shared/package.json ./shared/package.json
COPY server/prisma.config.ts ./server/prisma.config.ts
COPY server/prisma ./server/prisma

RUN npm ci

COPY . .
RUN npm run build
FROM build AS production-deps
RUN npm prune --omit=dev --ignore-scripts

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/server/package.json ./server/package.json
COPY --from=production-deps /app/server/dist ./server/dist
COPY --from=production-deps /app/server/src/generated/prisma ./server/src/generated/prisma
COPY --from=production-deps /app/client/dist ./client/dist

EXPOSE 8000
CMD ["node", "server/dist/server.js"]