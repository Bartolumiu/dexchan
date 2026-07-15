FROM node:24-alpine AS builder

RUN apk add --no-cache openssl && \
    corepack enable && \
    corepack prepare pnpm@latest --activate

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY --chown=node:node src ./src
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node prisma.config.ts ./

ARG DATABASE_URL="postgresql://fake:user@localhost:5432/ci"
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm exec prisma generate

FROM node:24-alpine
RUN apk add --no-cache openssl && corepack enable
WORKDIR /app
USER node
COPY --from=builder /app /app

CMD ["pnpm", "start"]
