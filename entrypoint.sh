#!/bin/sh
set -e

# If running as root, it means the --user directive for Docker CLI/Compose was not used
# Use then the PUID env
if [ "$(id -u)" = '0' ]; then
    groupmod -o -g "$PGID" node
    usermod -o -u "$PUID" node
    sudo -u "#$PUID" -g "#$PGID" node "$@"
else # if using the user directive, run normally
    exec node "$@"
fi
