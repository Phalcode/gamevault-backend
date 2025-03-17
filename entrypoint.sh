#!/bin/sh
echo "#################################################################################"
echo "#   ██████╗  █████╗ ███╗   ███╗███████╗██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗ #"
echo "#  ██╔════╝ ██╔══██╗████╗ ████║██╔════╝██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝ #"
echo "#  ██║  ███╗███████║██╔████╔██║█████╗  ██║   ██║███████║██║   ██║██║     ██║    #"
echo "#  ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║    #"
echo "#  ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗ ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║    #"
echo "#   ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝  ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝    #"
echo "#                                                      developed by Phalcode    #"
echo "#################################################################################"
set -e

echo "Starting container with PUID=${PUID} and PGID=${PGID}"
echo "Effective UID: $(id -u), GID: $(id -g)"

# If running as root, adjust the "node" user to match PUID/PGID,
# change ownership on directories, and drop privileges.
if [ "$(id -u)" = "0" ]; then
    # Only update the node user's UID/GID if different from defaults.
    if [ "${PUID}" != "1000" ] || [ "${PGID}" != "1000" ]; then
        echo "Updating 'node' user to PUID: ${PUID} and PGID: ${PGID}"
        groupmod -o -g "${PGID}" node
        usermod -o -u "${PUID}" node
    fi
    
    # Adjust ownership and ensure permissions are open.
    chown -R "${PUID}:${PGID}" /app/dist /files /media /logs /db /plugins /savefiles
    chmod -R 777 /app/dist /files /media /logs /db /plugins /savefiles
    
    # Drop privileges and run the command.
    exec sudo -u "#${PUID}" -g "#${PGID}" -E node "$@"
else
    # If running as non-root (e.g. using docker-compose "user:"), rely on open permissions.
    echo "Running as non-root user: $(id -u)"
    exec node "$@"
fi
