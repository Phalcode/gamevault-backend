# GameVault Backend Server Changelog

## 9.0.3

Recommended Gamevault App Version: `v1.7.3`

### Changes

- Fixed Backup and Restore not working anymore
- Fixed Admin Password reset not working anymore

### Thanks

- @Kudjo

## 9.0.2

Recommended Gamevault App Version: `v1.7.3`

### Changes

- Fixed Socket-Secret migration for POSTGRES Users that i broke in v9.0.1.

### Thanks

- @Kudjo
- @sandstormman

## 9.0.1

Recommended Gamevault App Version: `v1.7.3`

### Changes

- Fixed Socket-Secret migration for SQLITE Users.

## 9.0.0

Recommended Gamevault App Version: `v1.7.3`

### Breaking Changes & Migration

- Relocated all APIs from `/api/v1` to `/api`. This change reflects our move beyond version one, ensuring the most up-to-date and current API is always at `/api`.
- Deprecated `/api/health/admin` in favor of `/api/admin/health` to provide additional features for server admins in the future.
- Deprecated `/api/database/*` in favor of `/api/admin/database/*` for the same reason as above.
- The old routes will be removed in v11.0.0

### Changes

- [#205](https://github.com/Phalcode/gamevault-app/issues/205) Added real-time online/playing/busy/offline status.
- Introduced Socket Secret in `/api/users/me` to authenticate via Socket.IO
- The Debug Log level now only returns the redacted server configuration, without sensitive data.
- Published Async API doc on `/api/docs/async` (doesn't work on Docker, due to a bug, so it is disabled).
- Introduced new configuration `SERVER_ONLINE_ACTIVITIES_DISABLED` to disable activities.
- Fixed contract generation [#146](https://github.com/Phalcode/gamevault-backend/issues/146) (again).
- Configured Admin Health API to not write any logs.

### Thanks

- @yodatak
- @SergMonsterBro

## 8.0.3

Recommended Gamevault App Version: `v1.7.0`

### Changes

- Fixed Bug of 8.0.2 that using no filters at all would crash the server

## 8.0.2

Recommended Gamevault App Version: `v1.7.0`

### Changes

- Fixed Bug [#268](https://github.com/Phalcode/gamevault-app/issues/268) where your games could not be filtered based on their tags and genres.
- Also made Tags API faster by limiting pages to 100 results by default.

## 8.0.1

Recommended Gamevault App Version: `v1.7.0`

### Changes

- Fixed initial Database Setup not happening
- Increased stability of some migrations

## 8.0.0

Recommended Gamevault App Version: `v1.7.0`

### Breaking Changes & Migration

- [Issue #234](https://github.com/Phalcode/gamevault-app/issues/234): Added a new Health API endpoint for administrators to access detailed server information.

- The health endpoints now provide data in JSON format, replacing the previous fancy HTML page.

### Changes

- [Issue #253](https://github.com/Phalcode/gamevault-app/issues/253): Implemented the Database Backup and Restoration API.
- Improved data management: The server no longer saves empty progress entries with a "UNPLAYED" state and 0 minutes of playtime.
  - This change involved a database migration to remove such empty progress entries.
  - The Progress API now permanently deletes entries marked as unplayed with 0 minutes of playtime.
- Enhanced the Progress Upsert API to handle nullable fields, enabling partial updates.
- Performed additional code refactoring to ensure consistency in code structure and naming.

### Thanks

- @Kudjo

## 7.0.0

Recommended Gamevault App Version: `v1.6.1`

### Breaking Changes & Migration

- Case Insensitivity for Usernames and Emails:

  - Usernames and user emails are now treated as case-insensitive.
  - During the update to v7.0.0, a new database migration will check for users with conflicting usernames or emails caused by differences in letter casing.
  - If such conflicts are found, the migration will halt and report an error. This prevents the update to v7.0.0 until these conflicts are resolved.
  - Administrators are advised to revert to the previous GameVault version to address these conflicts and ensure a smooth transition to v7.0.0.

- Performance Enhancement: Removal of Progress Details and Filters from /games API:

  - To further enhance performance, the /games API no longer includes progress details and filters.

- Improved User Progress Handling:

  - User-related calls now include deleted game details in their progress information.
  - This enhancement allows for the correct display of progress even after a game has been deleted, ensuring a more comprehensive user experience.

### Changes

- Made Failing Game Downloads more robust
- Fixed missing indexation game type getting detected as difference

### Thanks

- @Kairubyte
- @MarshyMadness

## 6.0.0

Recommended Gamevault App Version: `v1.6.0`

### Breaking Changes & Migration

- We've removed the outdated Utility APIs. Instead, please switch to using the more current replacements.
- We've removed the Tags, Genres, Developers, and Publisher details from entries on the /games API for performace Reasons. To get all details for a game use the /game/:id API
- Fuzzy Search for Tags, Genres, Developers, and Publishers has been eliminated. (Previously for example, searching for a Publisher like "Rockstar" would return "GTA V") This change was made to improve search performance (18x speed)

### Changes

- Fixed the default CORS configuration.
- Significantly enhanced the RAWG Search API, resulting in approximately 5 times faster performance and reduced data consumption. [#187](https://github.com/Phalcode/gamevault-backend/issues/187). Previously, search results inadvertently generated numerous tags, genres, developers, and stores in your databases, as well as images on your filesystem. This is no longer the case. The RAWG Search now provides only essential game information for identification and remapping.
- Improved Search Performance.
- Enhanced Error-Handling during image downloads.
- Transitioned to the Debian `20.6-slim` docker image.
- Rectified "required/nullable" fields in the API Specification.
- Resolved the file title extraction issue. [#209](https://github.com/Phalcode/gamevault-app/issues/209).
- Fixed the Broken Content-Disposition Header for some downloads. [#209](https://github.com/Phalcode/gamevault-app/issues/209).
- Game Type only gets detected once, or when a game file changes and not on every index. [#200](https://github.com/Phalcode/gamevault-backend/issues/200)
- Unified global error handler for 4XX and 5XX messages. The Problem is now directly inside the response without the duplicated status.
- Implemented `(NC)` flag to disable rawg-caching for single games. [#194](https://github.com/Phalcode/gamevault-app/issues/194)

### Thanks

- @yodatak
- @Ben2303

## 5.0.2

Recommended Gamevault App Version: `v1.5.0`

### Changes

- Fixed Broken Database Migrations

### Thanks

- @Kudjo

## 5.0.1

Recommended Gamevault App Version: `v1.5.0`

### Changes

- Fixed Error when mapping RAWG Games that have no background_image.
- Fixed Error when downloading Games that have special Characters in their name.

## 5.0.0

Recommended Gamevault App Version: `v1.5.0`

### Breaking Changes & Migration

#### Issue #157: Optional User Information

- Email, First Name, and Last Name are no longer mandatory by default for new registrations. You can regain the previous functionality by configuring these options:
  - `USERS_REQUIRE_EMAIL` = true
  - `USERS_REQUIRE_FIRST_NAME` = true
  - `USERS_REQUIRE_LAST_NAME` = true

#### Removed Image Fields from Registration

- Removed all images from registration: To prevent spam attacks, we can't allow people to save images on your server without your permission. Therefore, we removed all image fields from registration.

### Changes

#### Runtime

- Updated to Node 20.6

#### Progress and Game Display

- Progress calls now include soft-deleted games, making it possible to display them correctly even after a game has been deleted.

#### Image Upload API

- Added a new API for Image Upload. [See Issue #173](https://github.com/Phalcode/gamevault-backend/issues/173).
- Introduced an option to set Images by their ID in the Update User and Update Game APIs.
- Implemented an API for updating Game Background Images.
- Added a configurable maximum image upload size, `IMAGE_MAX_SIZE_IN_KB` (default is 10,000 KB, which is 10MB).
- Enhanced file upload security with Magic Bytes Checking for images.
- Modified the Game Release Date to be nullable. [Now, filenames can consist only of the game title, see Issue #180](https://github.com/Phalcode/gamevault-backend/issues/180).
- Improved RAWG Matching Algorithm to use fewer calls to Rawg and work without Release Dates.
- Made Image Source URLs nullable and unique.
- Images are now saved with their correct file extensions.
- Limited image format support to bmp, jpeg, png, tiff, gif, and ico to ensure compatibility with WPF.
- Added `IMAGE_SUPPORTED_IMAGE_FORMATS`, you can change the supported Content-Type Headers for images with this parameter if you have a non WPF Client.
- Removed unused Image Garbage Collector configurations (`IMAGE_GC_INTERVAL_MINUTES` & `IMAGE_GC_KEEP_DAYS`).

#### API Specification

- Added `@ApiBasicAuth()` to all APIs except Health API #186

#### Bandwidth Control

- Implemented server-side bandwidth limit configuration `SERVER_MAX_DOWNLOAD_BANDWIDTH_IN_KBPS` to control the server's maximum bandwidth. [See Issue #10](https://github.com/Phalcode/gamevault-backend/issues/10).
- Added client-side bandwidth limit configuration through the `X-Download-Speed-Limit` Header in Download Requests.

#### Admin Features

- Admins now have the ability to delete the progress of other users by using the Progress ID.

#### RAWG Cache

- Changed the default RAWG Cache retention period from 7 days to 30 days since game data doesn't change frequently.

#### Database Changes

- Migrated Email, First Name, and Last Name as nullable fields in the database.
- Implemented Conditional Validators to ensure that only registrations matching the required user information configuration are accepted, denying registrations that don't meet the configuration criteria.
- Refactored the Configuration Class for improved organization and readability.
- First And Last Name fields now support German Umlauts (like ä,ö,ü, etc.).
- Added `RAWG_API_EXCLUDE_STORES` Config Parameter for Itch.io Indie-Game Lovers.
- Set RAWG API Calls to look for games on all Platforms & Consoles and not just PC.
- Fixed a bug where Boxarts couldn't be found for certain games because the search effort was insufficient.
- Added nullable uploader field to Image Enity and uploaded_images field to User Entity for traceability.

### Thanks

- @freitagdavid
- @Kairubyte
- @yodatak

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
- Changed project structure as preparatory work for [#140](https://github.com/Phalcode/gamevault-backend/issues/140)
- Implemented Update Game API (currently only supports rawg_id and box_image may come in handy for [#161](https://github.com/Phalcode/gamevault-backend/issues/161) in the future!)
- [#146](https://github.com/Phalcode/gamevault-backend/issues/146) Fixed OpenAPI Spec again

### Thanks

- @yodatak
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
