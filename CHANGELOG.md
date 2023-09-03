# GameVault Backend Server Changelog

## 5.0.0

### Changes

- TODO: Removed Deprecated Utility APIs

## 4.1.0

### Changes

- Progress calls now include soft-deleted games, allowing them to be displayed even after a game is deleted.
- Added an Image Upload API. [#173](https://github.com/Phalcode/gamevault-backend/issues/173)
- Added Image By Id Option to Register User, Update User and Update Game APIs
- Added Configurable Max Image Upload Size `IMAGE_MAX_SIZE_IN_KB` (Default is 10000 which is 10MB)
- Implemented Magic Byte Checking for images to enhance file upload security.
- Modified Game Release Date to be Nullable. [Filenames now consist only of the game title, see #180](https://github.com/Phalcode/gamevault-backend/issues/180).
- Made Image Source URLs Nullable for image uploading.
- Images are now saved with their proper extensions.
- Limited image format support to bmp, jpeg, png, tiff, gif, and ico, ensuring compatibility with WPF.
- Removed Unused Image Garbabe Collector Configurables (`IMAGE_GC_INTERVAL_MINUTES` & `IMAGE_GC_KEEP_DAYS`)
- Implemented Serverside Bandwidth Limit Configuration `SERVER_MAX_DOWNLOAD_BANDWIDTH_IN_KBPS` to control the servers max bandwidth #10
- Implemented Clientside Bandwidth Limit Configuration by `max_kbps` Header in Download Request
- Admins can now delete other Users Progresses by the Progress ID

## 4.0.1

### Changes

- Fix Database not Populating on new Installations

## 4.0.0

### Breaking Changes & Migration

- Implemented native Support for Single .exe and .sh files as described in [#144](https://github.com/Phalcode/gamevault-backend/issues/144). They get temporarily tarballed in `/tmp` and reused if possible.

- [#168](https://github.com/Phalcode/gamevault-backend/issues/168) - Deprecated Utility APIs and moved them to better designed places (Deprecated APIs willl eventually be removed in v5.0.0). Replacements are available as follows:
  - `/api/v1/utility/reindex` -> `/api/v1/files/reindex`
  - `/api/v1/utility/recache/{id}` -> `/api/v1/rawg/{id}/recache` (Also now available for EDITOR Role)
  - `/api/v1/utility/recache` -> `/api/v1/rawg/recache-all`
  - `/api/v1/utility/overwrite/{id}/rawg_id` -> `/api/v1/games/{id}`
  - `/api/v1/utility/overwrite/{id}/box_image` -> `/api/v1/games/{id}`

### Changes

- Fixed `SERVER_CORS_ALLOWED_ORIGINS` not working for multiple origins
- Fixed Vague Password Validation Message
- Fixed Version "undefined" on Server Startup Log
- Changed project structure as preparatory work for https://github.com/Phalcode/gamevault-backend/issues/140
- Implemented Update Game API (currently only supports rawg_id and box_image may come in handy for [#161](https://github.com/Phalcode/gamevault-backend/issues/161) in the future!)
- [#146](https://github.com/Phalcode/gamevault-backend/issues/146) Fixed OpenAPI Spec again

### Thanks

- @Yotadak
- @Kairubyte

## 3.0.0

### Breaking Changes & Migration

- Removed `(DP)` Direct Play flag. Use `(W_P)` instead. (It wasn't officially implemented yet but some of you may saw it in the docs)
- Removed `SERVER_PORT` Environment variable as it makes no sense to make it configurable inside the container. Just map your desired port to the containers 8080.
- Switched from an Alpine-based container to a Debian-based container, resulting in a fourfold increase in image size but enabling the server to use `7zip`.

### Changes

- Upgraded Dependencies to the latest version.
- Introduced game types a broad Enum, allowing better classification across different platforms and installation types.
- Implemented autodetection of the Game Type (Windows Portable or Windows Setup) based on the archive contents.
- Added a Game Type Override Flag (W_P) or (W_S) to manually set the type of wrongly detected games, simplifying the client installation process.
- Expanded GameVault support to all archive formats supported by `7zip`, enhancing compatibility with various game archives. (Including .iso)
- Added the ability to provide a custom list of file formats through a comma seperated list of format in the `GAMES_SUPPORTED_FILE_FORMATS` environment variable , allowing tailoring of supported formats according to specific needs.
- Polished the API specification for improved code generation.
- Implemented the `GAMES_SEARCH_RECURSIVE` configuration variable (default true), toggling the Indexer's search for games in subfolders of the `/files` directory.
- Changed the 404 error on the `/` path to a more descriptive message indicating that the web UI is not yet available.
- Prettified the response of `/api/v1/health`.
- Support for custom `PUID` & `PGID` via environment variables.
- Disabled Content Security Policies on Web UI so `/api/docs` load for everyone.

### Thanks

- @yodatak
- @Sapd
- @Xwaffle

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
