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
# If running as root, it means the --user directive for Docker CLI/Compose was not used
# Use then the PUID env to set the user and group IDs
if [ "$(id -u)" = '0' ]; then
    # Modify the group ID of the 'node' user to match the PGID environment variable
    groupmod -o -g "$PGID" node
    # Modify the user ID of the 'node' user to match the PUID environment variable
    usermod -o -u "$PUID" node
    # Run the specified command with the modified user and group IDs
    sudo -u "#$PUID" -g "#$PGID" -E node "${@}"
else
    # If using the user directive, run the specified command normally
    exec node "${@}"
fi
