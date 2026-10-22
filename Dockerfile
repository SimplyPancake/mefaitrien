
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS build
RUN corepack enable
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM base AS prisma-runtime
RUN npm install --prefix /opt/prisma --omit=dev --no-save prisma@7.10.1 dotenv@18.0.8 \
    && npm cache clean --force
COPY prisma.config.ts /opt/prisma/prisma.config.ts
COPY prisma/schema.prisma /opt/prisma/prisma/schema.prisma
COPY prisma/migrations-mariadb /opt/prisma/prisma/migrations-mariadb

FROM base AS runtime
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000

# Copy Nuxt output
COPY --from=build --chown=node:node /app/.output ./.output

COPY --from=prisma-runtime --chown=node:node /opt/prisma /opt/prisma

# Copy entrypoint and set permissions before switching user
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
    && mkdir -p /media/storage/profile-images \
    && chown -R node:node /media/storage

USER node
EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
