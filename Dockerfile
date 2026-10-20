
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS build
RUN corepack enable
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM base AS runtime
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000

# Copy Nuxt output
COPY --from=build --chown=node:node /app/.output ./.output

# Copy Prisma schema and migrations for deployment
COPY --from=build --chown=node:node /app/prisma ./prisma

# Ensure Prisma CLI and dependencies are available at runtime
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json

# Copy entrypoint and set permissions before switching user
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER node
EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
