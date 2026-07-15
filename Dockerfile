FROM node:24-alpine

RUN apk add --no-cache openssl && \
    corepack enable

WORKDIR /app
RUN chown node:node /app

USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --chown=node:node src ./src
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node prisma.config.ts ./

RUN DATABASE_URL="postgresql://fake:user@localhost:5432/ci" pnpm dlx prisma@7.8.0 generate

CMD ["pnpm", "start"]
