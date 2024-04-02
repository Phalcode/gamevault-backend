#!/bin/sh
set -e

# Function to create a directory if it does not exist and set the proper ownership
createDirectoryIfNotExist() {
  if [ ! -d "$1" ]; then
    echo "Directory \"$1\" does not exist. Trying to create a new one..."
    sudo mkdir -p "$1"
    sudo chown "$PUID":"$PGID" "$1"
  fi
}

# Check and create necessary folders if they do not exist
check_folders() {
  if [ "$MOCK_FILES" = "true" ]; then
    echo "Not checking or creating any folders because MOCK_FILES is set to true"
    return
  fi

  # Set default values if environment variables are not set or are empty
  [ -z "$FILES_VOLUME" ] && FILES_VOLUME="/files"
  [ -z "$IMAGES_VOLUME" ] && IMAGES_VOLUME="/images"
  [ -z "$LOGS_VOLUME" ] && LOGS_VOLUME="/logs"
  [ -z "$SQLITEDB_VOLUME" ] && SQLITEDB_VOLUME="/db"

  createDirectoryIfNotExist "$FILES_VOLUME"
  createDirectoryIfNotExist "$IMAGES_VOLUME"
  createDirectoryIfNotExist "$LOGS_VOLUME"
  createDirectoryIfNotExist "$SQLITEDB_VOLUME"
}

# Perform directory checks
check_folders

# Existing logic for user permissions and running the node process
if [ "$(id -u)" = '0' ]; then
    groupmod -o -g "$PGID" node
    usermod -o -u "$PUID" node
    # Ensure that all specified directories are owned by the node user
    sudo chown -R "$PUID":"$PGID" "$FILES_VOLUME" "$IMAGES_VOLUME" "$LOGS_VOLUME" "$SQLITEDB_VOLUME"
    # Execute the command as the node user
    sudo -u "#$PUID" -g "#$PGID" -E node "${@}"
else # if using the user directive, run normally
    exec node "${@}"
fi