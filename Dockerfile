FROM node:lts-slim AS base

ENV TZ="Etc/UTC"
ENV PUID=1000
ENV PGID=1000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV SERVER_PORT=8080
ENV YES=yes

RUN mkdir -p /files /media /logs /db /plugins /savefiles \
    && chown -R node:node /files /media /logs /db /plugins /savefiles \
    && chmod -R 777 /files /media /logs /db /plugins /savefiles \
    && sed -i -e's/ main/ main non-free non-free-firmware contrib/g' /etc/apt/sources.list.d/debian.sources \
    && apt update \
    && apt install -y curl p7zip-full p7zip-rar postgresql-common sudo \
    && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh \
    && apt install -y postgresql-client \
    && apt clean \
    && npm i -g pnpm@^10.4.1

WORKDIR /app

FROM base AS build

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM base AS release

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./

COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules

COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE ${SERVER_PORT}/tcp

HEALTHCHECK --start-period=300s CMD curl -f http://localhost:${SERVER_PORT}/api/health || exit

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD [ "dist/src/main" ]
