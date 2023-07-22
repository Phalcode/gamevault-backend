FROM node:20.2-alpine AS base
# Installs global dependencies as non root user for security
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

# Uses environment variables from configuration.ts
ENV SERVER_TZ=UTC
ENV SERVER_PORT=8080
ENV VOLUMES_FILES="/files"
ENV VOLUMES_IMAGES="/images"
ENV VOLUMES_LOGS="/logs"
ENV VOLUMES_SQLITEDB="/db"

# Sets timezone, installs pnpm, creates and chowns the needed volumes for the node user
RUN apk add --no-cache tzdata curl 7zip && cp /usr/share/zoneinfo/$SERVER_TZ /etc/localtime \
    && npm i -g pnpm \
    && mkdir /app $VOLUMES_FILES $VOLUMES_IMAGES $VOLUMES_LOGS $VOLUMES_SQLITEDB \
    && chown node:node /app $VOLUMES_FILES $VOLUMES_IMAGES $VOLUMES_LOGS $VOLUMES_SQLITEDB

# Copies the entire repository into the container
WORKDIR /app
COPY . .

#Installs Dependencies & Builds Server
RUN pnpm install && pnpm build

# Uses non-root user to run the container
USER node
CMD [ "npm", "run", "start:prod" ]
EXPOSE $SERVER_PORT

# Periodic Healthcheck on /api/v1/health
HEALTHCHECK CMD curl -f http://localhost:$SERVER_PORT/api/v1/health || exit
