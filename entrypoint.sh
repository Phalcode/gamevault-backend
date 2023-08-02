#!/bin/sh
set -e

# If running as root, it means the --user directive for Docker CLI/Compose was not used
# Use the PUID env then
if [ "$(id -u)" = '0' ]; then
    deluser node
    addgroup -S node -g $PGID
    adduser -S -G node -u $PUID node
    sudo -u "#$PUID" -g "#$PGID" node "$@"
else
    exec node "$@"
fi