# Use the official Node LTS slim image as the base
FROM node:lts-slim AS base

# Set environment variables
ENV TZ="Etc/UTC" \
    PUID=1000 \
    PGID=1000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    NPM_CONFIG_PREFIX=/home/node/.npm-global \
    PNPM_HOME=/pnpm \
    SERVER_PORT=8080 \
    YES=yes \
    PATH="/home/node/.npm-global/bin:/pnpm:$PATH"

# Create necessary directories with appropriate permissions
RUN mkdir -p /files /media /logs /db /plugins /savefiles \
    # Enable non-free and contrib repositories for Debian-based package installations
    && sed -i -e 's/ main/ main non-free non-free-firmware contrib/g' /etc/apt/sources.list.d/debian.sources \
    # Update package list and install necessary dependencies
    && apt update \
    && apt install -y --no-install-recommendscurl p7zip-full p7zip-rar postgresql-common sudo \
    # Install PostgreSQL client from the PostgreSQL Global Development Group (PGDG)
    && /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh \
    && apt install -y --no-install-recommends postgresql-client \
    # Clean up to reduce image size
    && apt clean && rm -rf /var/lib/apt/lists/* \
    # Install PNPM package manager globally
    && npm i -g pnpm@^10.12.1

# Set working directory for the application
WORKDIR /app

# ---- Build Stage ----
FROM base AS build

# Copy dependency files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy application source code and build the project
COPY . .
RUN pnpm run build

# ---- Production Dependencies Stage ----
FROM base AS prod-deps

# Copy dependency files and install only production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# ---- Release Stage ----
FROM base AS release

# Set the environment to production mode
ENV NODE_ENV=production

# Copy dependency files (ensuring same versions as build)
COPY package.json pnpm-lock.yaml ./

# Copy built application and production dependencies
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node  entrypoint.sh /usr/local/bin/

RUN chown -R node:node /app/dist /files /media /logs /db /plugins /savefiles \
    && chmod -R 777 /app/dist /files /media /logs /db /plugins /savefiles \
    && chmod +x /usr/local/bin/entrypoint.sh

# Expose the server port
EXPOSE ${SERVER_PORT}/tcp

# Add a health check for the service
HEALTHCHECK --start-period=300s CMD curl -f http://localhost:${SERVER_PORT}/api/status || exit 1

# Set entrypoint and default command
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["dist/src/main"]