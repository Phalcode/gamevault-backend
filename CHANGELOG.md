# GameVault Backend Server Changelog

## Upcoming

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
- New Configuration: `LOG_FILES_ENABLED` is now set to false by default.
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
