FROM node:24-alpine

RUN corepack enable

WORKDIR /app
RUN chown node:node /app

USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --chown=node:node src ./src
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node prisma.config.ts ./

RUN pnpm dlx prisma generate

CMD ["pnpm", "start"]
