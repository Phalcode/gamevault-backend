# Use the official Node LTS slim image as the base
FROM node:lts-slim AS base

# Set timezone and UID/GID defaults
ENV TZ="Etc/UTC" \
    PUID=1000 \
    PGID=1000

# Install necessary packages (including sudo) and pnpm
RUN sed -i 's/main/main contrib non-free/' /etc/apt/sources.list/debian.sources \
    && apt-get update \
    && apt-get install -y curl p7zip-full p7zip-rar postgresql-client sudo \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Build stage ---
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# --- Release/Production stage ---
FROM base AS release
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy built files and production dependencies
COPY --from=build --chown=node:node --chmod=777 /app/dist ./dist
COPY --from=build --chown=node:node --chmod=777 /app/node_modules ./node_modules

# Ensure directories have open permissions (in case later COPY commands altered them)
RUN mkdir -p /app /files /media /logs /db /plugins /savefiles \ 
    && chmod -R 777 /app /files /media /logs /db /plugins /savefiles

# Copy the entrypoint script and make it executable
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE ${SERVER_PORT}/tcp

HEALTHCHECK --start-period=300s CMD curl -f http://localhost:${SERVER_PORT}/api/health || exit

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD [ "dist/src/main" ]
