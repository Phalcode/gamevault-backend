# GameVault Backend Server Changelog

## Upcoming

## 2.1.0

### Changes

- Added **7zip to the Alpine Container**: The Alpine container now includes 7zip support, enabling handling of a wider range of archive formats.
- Removed **Direct Play Boolean** and introduced a broader **Game Type Enum**: Instead of a simple boolean, games now have a more flexible Game Type classification to allow better classification across different platforms and installation types.
- Added **Windows Portable Override Flag (W_P)**: You can now manually mark windows games that don't require an installation to simplify the client installation process.
- Added **Windows Setup Override Flag (W_S)**: You can now manually mark windows games that require an installation to simplify the client installation process.
- Added **Autodetection of Game Type** (currently only supports Windows Portable and Windows Setup): The system can automatically detect the Game Type (Windows Portable or Windows Setup) based on the archive contents. However, administrators can still manually override the detected type by specifying it in the filename if gets detected wrong.
- **Expanded GameVault Support to All Archive Formats Supported by 7zip**: GameVault can now work with any archive formats that 7zip supports, enhancing compatibility with various game archives.
- **Custom List of Supported File Formats**: You can now provide your own comma-seperated-list of supported file formats through the Config GAMES_SUPPORTED_FILE_FORMATS. For example `.rar,.7z,.zip` This customization allows you to tailor the supported formats according to your needs. However, it's essential to be cautious about including file formats not supported by 7zip, as it could lead to loss of some functionalities (like auto-type-detection) or errors.
- **Polished API Specification**: The API specification has been refined and optimized for code generation.
- Implemented `SEARCH_RECURSIVE` Configuration Variable (default true), to toggle if the Indexer should look for games in subfolders of the `/files` directory

### Thanks

- @yodatak

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
