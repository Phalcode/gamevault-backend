FROM node:20.2-alpine AS base
ENV SERVER_TZ=UTC
ENV SERVER_PORT=8080
# Define the volumes for files, images, logs, and sqlite database
ENV VOLUMES_FILES="/files"
ENV VOLUMES_IMAGES="/images"
ENV VOLUMES_LOGS="/logs"
ENV VOLUMES_SQLITEDB="/db"
# Install necessary dependencies and create required directories
RUN apk add --no-cache tzdata curl && cp /usr/share/zoneinfo/$SERVER_TZ /etc/localtime \
    && npm i -g pnpm \
    && mkdir /app $VOLUMES_FILES $VOLUMES_IMAGES $VOLUMES_LOGS $VOLUMES_SQLITEDB \
    && chown node:node /app $VOLUMES_FILES $VOLUMES_IMAGES $VOLUMES_LOGS $VOLUMES_SQLITEDB
WORKDIR /app

FROM base AS dependencies
# Copy package.json and pnpm-lock.yaml files
COPY package.json pnpm-lock.yaml ./
# Install project dependencies using pnpm
RUN pnpm install

FROM base AS build
# Copy the entire project directory
COPY . .
# Build the project
RUN pnpm build

FROM base AS deploy
# Switch to the 'node' user for running the application
USER node
# Start the application in production mode
CMD [ "npm", "run", "start:prod" ]
# Expose the server port
EXPOSE $SERVER_PORT
# Define a health check for the running application
HEALTHCHECK CMD curl -f http://localhost:$SERVER_PORT/api/v1/health || exit
