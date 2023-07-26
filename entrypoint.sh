#!/bin/sh
set -e

# If running as root, it means the --user directive for Docker CLI/Compose was not used
# Use then the PUID env
if [ "$(id -u)" = '0' ]; then
    deluser node
    addgroup -S node -g $PGID
    adduser -S -G node -u $PUID node

    exec su-exec "$PUID:$PGID" node "$@"
else # if using the user directive, run normally
    exec node "$@"
fi
