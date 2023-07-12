FROM node:20.2-alpine AS base
ENV SERVER_TZ=UTC
ENV SERVER_PORT=8080
ENV VOLUMES_FILES="/files"
ENV VOLUMES_IMAGES="/images"
ENV VOLUMES_LOGS="/logs"
ENV VOLUMES_SQLITEDB="/db"
RUN apk add --no-cache tzdata curl && cp /usr/share/zoneinfo/$SERVER_TZ /etc/localtime \
    && npm i -g pnpm \
    && mkdir /app $VOLUMES_FILES $VOLUMES_IMAGES $VOLUMES_LOGS $VOLUMES_SQLITEDB \
    && chown node:node /app $VOLUMES_FILES $VOLUMES_IMAGES $VOLUMES_LOGS $VOLUMES_SQLITEDB
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build
USER node
CMD [ "npm", "run", "start:prod" ]
EXPOSE $SERVER_PORT
HEALTHCHECK CMD curl -f http://localhost:$SERVER_PORT/api/v1/health || exit
