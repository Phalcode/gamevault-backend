#!/bin/sh
set -e


# Ensures old CPU compability. See https://github.com/lovell/sharp/issues/3743.
if ! cat /proc/cpuinfo | grep -q "avx\|sse4_2"; then
    echo "Force installing sharp@0.25.4 to ensure compability with older CPUs"
    pnpm install sharp@0.25.4
fi

# If running as root, it means the --user directive for Docker CLI/Compose was not used
# Use then the PUID env
if [ "$(id -u)" = '0' ]; then
    groupmod -o -g "$PGID" node
    usermod -o -u "$PUID" node
    sudo -u "#$PUID" -g "#$PGID" node "$@"
else # if using the user directive, run normally
    exec node "$@"
fi
