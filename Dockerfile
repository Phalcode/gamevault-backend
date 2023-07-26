FROM node:20-alpine AS base

# Default Variables
ENV PUID=1000
ENV PGID=1000

# Build time variables
## Allow non-root usage
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

ENV SERVER_TZ=UTC
ENV SERVER_PORT=8080

VOLUME /files /images /logs /db

# Sets timezone, installs pnpm, creates and chowns the needed volumes for the node user
RUN apk add --no-cache su-exec tzdata curl 7zip \
    && cp /usr/share/zoneinfo/$SERVER_TZ /etc/localtime \
    && npm i -g pnpm

WORKDIR /app

FROM base AS build
# Copy files only needed for install
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
# Copy everything for building
COPY . .
RUN pnpm run build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM base AS release
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules

# Chown /app to the original node user (1000)
# As only read is needed this is fine when using --user or PUID
RUN chown -R node:node /app

# Entry script for providing dynamic env changes like PUID
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE ${SERVER_PORT}/tcp
# Periodic Healthcheck on /api/v1/health
HEALTHCHECK CMD curl -f http://localhost:${SERVER_PORT}/api/v1/health || exit

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD [ "dist/main" ]
