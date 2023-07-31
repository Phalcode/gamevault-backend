# GameVault Backend Server Changelog

## Upcoming

## 3.0.0

### Deprecations

- Removed (DP) Direct Play flag. (It wasn't officially implemented yet but some of you may saw it in the docs)
- Removed `SERVER_PORT` Environment variable as it makes no sense to make it configurable inside the container.

### Changes

- Upgraded Dependencies to the latest version.
- Added 7zip support to the Alpine container, enabling the handling of a wider range of archive formats.
- Changed game type handling by introducing a broader Game Type Enum, allowing better classification across different platforms and installation types.
- Implemented autodetection of the Game Type (Windows Portable or Windows Setup) based on the archive contents, with the ability to manually override it in the filename if detected incorrectly.
- Added a Game Type Override Flag (W_P) or (W_S) to manually set the type of wrongly detected games, simplifying the client installation process.
- Expanded GameVault support to all archive formats supported by 7zip, enhancing compatibility with various game archives. (Including .iso)
- Added the ability to provide a custom list of file formats through a comma seperated list of format in the `GAMES_SUPPORTED_FILE_FORMATS` environment variable , allowing tailoring of supported formats according to specific needs.
- Polished the API specification for improved code generation.
- Implemented the `GAMES_SEARCH_RECURSIVE` configuration variable (default true), toggling the Indexer's search for games in subfolders of the `/files` directory.
- Changed the 404 error on the `/` path to a more descriptive message indicating that the web UI is not yet available.
- Enhanced the response on `/api/v1/health` to return meaningful information.
- The server now supports custom `PUID` & `PGID` via environment variables.
- Implemented automatic compatibility mode for the image processing library `sharp` on older CPUs.
- Disabled Content Security Policies on Web UI so `/api/docs` load for everyone.

### Thanks

- @yodatak
- @\_Ben2303
- @sparten9999
- @Sapd

## 2.0.0

### Breaking Changes & Migration

- GameVault Rebranding:
  - If your previous `DB_DATABASE` or `DB_USERNAME` was set as `Crackpipe` (default), please adjust the Environment Variables or make the necessary SQL modifications to ensure the app's functionality.
  - Update your docker/ghcr images to "gamevault-backend" as there will be no further updates for `crackpipe-backend`
  - For SQLITE users, rename your database file to `database.sqlite`, the new default
  - Please switch off `DB_SYNCHRONIZE` if you had set it to true manually, because the migrations will take over controlled database changes from now on.

### Changes

- Implemented database migrations for postgresql and sqlite.
- `DB_SYNCHRONIZE` is now false by default.
- New Configuration: `SERVER_LOG_FILES_ENABLED` is now set to false by default.
- Games API now supports the `contains` filter.
- Non-root global npm packages have been added to the Dockerfile.
- Introduced a new Log Level: `off`

## 1.3.1

### Changes

- hotfixed broken build because of Multi-Layer Build

## 1.3.0

### Changes

- Fix `/logs` not being created due to permission error
- Introduce Multi-Layer Docker Build
- Use `node` user in Container instead of `root` (`user: 1000:1000` is not needed anymore in docker-compose)
- Introduced new `VOLUME_*` configurations.

### Deprecations

- Deprecated IMAGE_STORAGE_PATH in favor of VOLUMES_IMAGES (will be removed in 2.0.0)
- Deprecated DB_STORAGE_PATH in favor of VOLUMES_SQLITEDB (will be removed in 2.0.0)

### Thanks

- @super_n0bita

## 1.2.0

### Changes

- Server inspects mounted folders during startup
- Implemented Docker health checks
- Improved Logging
- Introduced Rolling File Logger with retention period of 14 days
- Boxarts now work independently from RAWG

### Thanks

- @Mr.Deathproof
- @AbacchioJones

## 1.1.0

### Breaking Changes

- When adding the same game multiple times to your GameVault server, [follow this documentation.](https://gamevau.lt/docs/server-docs/adding-games#adding-the-same-game-multiple-times)

### Changes

- Various improvements have been made to indexing, restoring, and updating games.
- Thanks to the use of Node 20 the `/files` directory is now readable recursively, allowing you to create sub-folders in `/files` for better organization.
- Fixed File-Size being returned as a number when SQLITE is being used as Database.
- The Game Indexer now has a failsafe mechanism. If it encounters any incorrect file, it will generate a log and skip it.
- Images are now optional for registering a user
- Improve Error Logs

### Thanks

- @mhbates

## 1.0.4

### Changes

- Fixed a bug where the first game indexing was skipped.

### Thanks

- @mhbates

## 1.0.0

- Initial Release!
