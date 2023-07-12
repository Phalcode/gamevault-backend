FROM node:20.2-alpine AS base

ENV SERVER_TZ=UTC
ENV SERVER_PORT=8080
ENV VOLUMES_FILES = "/files"
ENV VOLUMES_IMAGES = "/images"
ENV VOLUMES_LOGS = "/logs"
ENV VOLUMES_SQLITEDB = "/db"

RUN apk add --no-cache tzdata curl && cp /usr/share/zoneinfo/$SERVER_TZ /etc/localtime
RUN npm i -g pnpm

RUN mkdir /app /files /images /logs /db
RUN chown node:node /app /files /images /logs /db

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml .
RUN pnpm install

FROM base AS build

COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM base AS deploy

USER node
CMD [ "npm", "run", "start:prod" ]
EXPOSE $SERVER_PORT
HEALTHCHECK CMD curl -f http://localhost:$SERVER_PORT/api/v1/health || exit