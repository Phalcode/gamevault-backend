# GameVault Backend Server Changelog

## 16.2.0

### Changes

- Fixed usage of deprecated Node 22 property
- Fixed Session Cleanup Algorithm failing to work on large servers.

## 16.1.2

### Changes

- Fix Age Rating Check being Applied to Admins for Game Downloads
- Fix Covers/Metadata missing after metadata refreshes
- Added `TESTING_LOG_HTTP_TRAFFIC_ENABLED` parameter to help analyze network traffic
- Fixed `early_access` being required in UpdateGameDto inconsistency in OpenAPI contract
- Fixed `name` not being mentioned in MetadataProviderDto inconsistency in OpenAPI contract
- Fixed metadata controllers returning tags, genres, publishers & developers for deleted games
- Deleting and Restoring games now clears / remerges effective metadata
- Fixed not being able to edit NC games.

### Thanks

- @always_sings_along

## 16.1.1

### Changes

- Fix `/config` folder not being created in docker environments.

## 16.1.0

### Changes

- Implemented Dynamic WebUI Downloader that automatically fetches the latest Web-UI version.
- Added some configuration variables for the WebUI.
- Removed older configuration variables for Landing Page and API Documentation.
- [#539](https://github.com/Phalcode/gamevault-app/issues/539) Fixed an issue were remaps were not working.
- Fixed some API Spec inconsistencies

## 16.0.1

### Changes

- [#373](https://github.com/Phalcode/gamevault-backend/issues/373) Fixed server not starting when WebUI is disabled. But who disables this awesome new feature anyway?

### Thanks

- @Elekam

## 16.0.0

### Changes

- Implemented a Web UI for the server 🤘. Have fun.
- [#367](https://github.com/Phalcode/gamevault-backend/issues/367) Fixed admins not being able to update underage users.
- Implemented OTP API for unauthenticated Downloads
- Fixed a bug where birthdays were not being required in status service, when Parental Control was enabled.

### Thanks

- @strese

## 15.0.3

### Changes

- Fixes for breaking IGDB API changes and dependency updates.

## 15.0.2

### Changes

- Security fix regarding logging and auth seed generation.

## 15.0.1

### Changes

- [#364](https://github.com/Phalcode/gamevault-backend/issues/364) Parental Control
  - Games without any age rating set, are now shown in the game list for all users. -> **If you use parental control, apply an age rating to your games, if you don't want to show them to everyone.**
  - Admins can now see all games, regardless of their age rating.
- [#362](https://github.com/Phalcode/gamevault-backend/issues/362) Gracefully handle chown/chmod failures on NFS-mounted volumes
- [#363](https://github.com/Phalcode/gamevault-backend/issues/363) IGDB ID Search Results now always return as first result.
- [#365](https://github.com/Phalcode/gamevault-backend/issues/365) Fixed Early Access Games not showing up in the Early Access List, depending on the filename. -> **Recache games, that still show issues**
- Redirected early access and release date sorting & filtering to the respective metadata fields.
- [#354](https://github.com/Phalcode/gamevault-backend/issues/354) Moved setting the default install parameters from IGDB Provider to fallback in metadata merge process and only set them if its a Windows Setup Game.

### Thanks

- @jbonadiman
- @Elekam
- @strese

## 15.0.0

### Breaking Changes & Migration

- Completely Overhauled Authentication System -> **Update your GameVault Client Application. Clients older than 1.17.0.0 will no longer work with this version. If you use the API, make sure to consult the documentation to learn how to authenticate with this release.**
- Renamed some environment variables -> **Update your environment variables if you rely on them.**
  - `SEARCH_RECURSIVE` to `GAMES_SEARCH_RECURSIVE`
  - `CONFIGURATION_STACK_TRACE_LIMIT` to `SERVER_STACK_TRACE_LIMIT`
    The deprecated variables will be removed in **v16.0.0**.
- [#6](https://github.com/Phalcode/gamevault-backend/issues/6) **Added support for OAuth 2.0 and SSO Logins.**
- Moved `/api/health` to `/api/status` -> **Health API will be removed in v16.0.0.**
- **Removed deprecated APIs**.

### Changes

- Users can now also login via email and password using the basic-auth login.
- Added more information about registrations to the server in the `/api/status` endpoint.
- Fixed IGDB Integration throwing 429s for servers with lots of games
- Fixed some wrong data in the OpenAPI Specification
- Optimized some synchronous tasks
- [#500](https://github.com/Phalcode/gamevault-backend/issues/500) Implemented `installer_parameters`, `uninstaller_parameters`, and `uninstaller_executable` fields in game metadata.
- [#502](https://github.com/Phalcode/gamevault-backend/issues/502) & [#344](https://github.com/Phalcode/gamevault-backend/issues/344) Implemented Default Innosetup & NSIS Installer Params for IGDB Provider
- [#488](https://github.com/Phalcode/gamevault-app/issues/488) Fixed bug where users could not be registered without first and last name.
- [#496](https://github.com/Phalcode/gamevault-app/issues/496) Fixed bug where manually edited early access games would not show up in the early access list.
- Added `GAMES_INDEX_USE_POLLING` env var to enable filewatching of remote networks or docker for windows containers.
- [#359](https://github.com/Phalcode/gamevault-app/issues/359) Implemented API-Key Authentication

### Thanks

- @Toylerrr

## 14.1.2

### Changes

- Loosened some container internal permissions so non-root users can use plugins

### Thanks

- @HiImaWalrus

## 14.1.1

### Changes

- Implement latest IGDB API and automatic model generation
- Fix Special Game Editons not being found
- [#475](https://github.com/Phalcode/gamevault-app/issues/475) Improved Partial File Downloads to be much faster

### Thanks

- @s-crypt
- @magne4000
- @Omni_Noesis
- @Sixdd6

## 14.1.0

### Changes

- [#462](https://github.com/Phalcode/gamevault-backend/issues/462) Added filter options for developers and publishers.

### Thanks

- @ramblepaw

## 14.0.0

### Breaking Changes & Migration

- The `DELETE /api/v1/progress/:progress-id` and `GET /api/v1/progress/:progress-id` endpoints are deprecated: **Use `DELETE /user/:user_id/game/:game_id` and `GET /user/:user_id/game/:game_id` instead**. The deprecated endpoints will be removed in v15.0.0.

- Implemented Support for Savefile Uploads & Downloads: **If you want to use this feature, mount a folder to `/savefiles` and set `SAVEFILES_ENABLED` to true.**

### Changes

- [#339](https://github.com/Phalcode/gamevault-backend/issues/339) Added option to disable the landing page: **Set `SERVER_LANDING_PAGE_ENABLED` to false if you want to disable the landing page.**
- [#469](https://github.com/Phalcode/gamevault-app/issues/469) IGDB Game Search Results now contain a description.

### Thanks

- @Toylerrr
- @RobinDadswell
- Our Early Access Testers

## 13.1.3

### Changes

- Fixed file path validation crashing the server in certain circumstances.
- Added Symlink Following to the filewatcher
- Added Latest PGSQL Client to the image.

## 13.1.2

### Changes

- Added Game Backgrounds into the results object of the game search for preloading purposes.
- Fixed a bug where provider metadata was unmapped before new metadata was added.

## 13.1.1

### Changes

- [#286](https://github.com/Phalcode/gamevault-backend/issues/286) Implemented workaround for [Nestjs-Schedule regression](https://github.com/nestjs/schedule/issues/1794).
- Optimized Indexer
- Fixed a server error, when registering a user that was previously soft-deleted.

## 13.1.0

### Changes

- [#426](https://github.com/Phalcode/gamevault-app/issues/426) implemented filters for progress states in game search
- Fixed Metadata Search to not include Edition Tags.
- Fixed Plugin Loader crashing serveron some systems

### Thanks

- @D-E-N-U
- @spaceboy
- @Kudjo

## 13.0.4

### Changes

- Fixed a stupid bug where users could not run a server without plugins.

## 13.0.3

### Changes

- Implemented Auto Plugin injection short circuit for developers.

## 13.0.2

### Changes

- Fixed plugin loader not loading plugins.

### Thanks

- @nosyrbllewe on Discord

## 13.0.1

### Changes

- Fixed a bug where you could not delete existing progresses.
- Fixed a bug in SQLITE migration.
- Fixed a bug where updating some users lead to database errors.
- Enabled UPPERCASE SERVER_LOG_LEVEL environment variable values.

### Thanks

- @sebastrion on Discord
- @yann577 on Discord
- @johanstrese on Discord
- @MisterVertigo on Discord

## 13.0.0

Recommended Gamevault App Version: `v1.12.5.0`

### Breaking Changes & Migration

**A lot** has changed in this version. Honestly, I’ve almost rewritten the entire codebase.

Please read the migration instructions below **BEFORE UPDATING**! (Migration instructions are marked **in bold**)

**For existing servers:** The migration process may take up to 30 minutes or even longer for larger servers. During this time, clients will not be able to use the server. The container may appear as UNHEALTHY after 5 minutes during a long migration, but don’t worry—let it run as long as logs are active. Be sure to disable any auto-heal processes for GameVault to avoid interruptions.

**After the migration:** The existing data might not be visible at first glance because we need to "merge" it. This could also take a while. Check the logs for inactivity before contacting us about this.

- Major database and codebase overhaul!
  - **I’ve done my best to migrate your existing data, but nobody’s perfect. Be sure to back up your data thoroughly before migrating, and contact us if you encounter any migration errors.**
- Some configurations and environment variables have changed.
  - **Ensure your environment variables are [configured correctly](https://gamevau.lt/docs/server-docs/configuration).**
- [#140](https://github.com/Phalcode/gamevault-backend/issues/140): Introduced a new plugin framework that universally supports any metadata provider plugin and implemented a built-in IGDB Metadata Provider Plugin as the new default.
  - **This is necessary, as RAWG integration has been removed. Learn how to set up the IGDB plugin [here](https://gamevau.lt/docs/server-docs/metadata-enrichment/provider-igdb).**
  - **IGDB metadata is now prioritized over RAWG, as its data quality is superior. If you want your existing data to remain the primary source, set the `METADATA_IGDB_PRIORITY` environment variable to a value lower than `-10` before running the update.**
  - **We recommend first migrating the server to v13, then setting up IGDB and restarting, to minimize downtime.**
  - **Old experimental plugins are no longer supported. Remove them if you were using any (Spoiler: You probably weren’t).**
- Added support for more media types beyond just images. You can now upload audio and video files as well.
  - **You now need to mount your `/images` volume as `/media`.**
- Implemented parental control features. [#304](https://github.com/Phalcode/gamevault-backend/issues/304)
  - **Learn how it works and how to set it up [here](https://gamevau.lt/docs/server-docs/parental-control).**
- Various API changes.
  - **Check the API documentation for any updates if you're using the REST API.**

### Changes

- Removed RAWG integration and all configurations for it.
- Removed Google Images Boxart Scraper. (Let's be honest, it was shit anyway.)
- Optimized the Game Indexer. It now usually only reads games that have changed instead of reading all files all the time.
- Optimized startup time.
- [#161](https://github.com/Phalcode/gamevault-backend/issues/161) Implemented editing of games.
- [#423](https://github.com/Phalcode/gamevault-app/issues/423) Implemented a `news.md` (a.k.a. Message of the Day) file and a `GET /config/news` API you can use to communicate news to your users. -> **Learn how to set it up [here](https://gamevau.lt/docs/server-docs/server-news).**
- Implemented a notes field in games.
- Implemented default launch parameters, default launch executable, and default installer file fields in games.

## 12.2.0

Recommended Gamevault App Version: `v1.11.0.0`

### Changes

- Fixed a bug where the indexer would break on password protected archives. [#297](https://github.com/Phalcode/gamevault-backend/issues/297)
- Added Ability to set a default password for game type detection. (`GAMES_DEFAULT_ARCHIVE_PASSWORD`)

### Thanks

- @casudo
- @Tere

## 12.1.3

Recommended Gamevault App Version: `v1.11.0.0`

### Changes

- Fixed a bug where Range header was not inclusive, like it should be according to its specification [#298](https://github.com/Phalcode/gamevault-backend/issues/298)

### Thanks

- @Toylerr
- @mjishnu

## 12.1.2

Recommended Gamevault App Version: `v1.10.1.0`

### Changes

- Fixed a bug where demo mode was not blocking off malicious requests.

### Thanks

- @Toylerr

## 12.1.1

Recommended Gamevault App Version: `v1.10.0.0`

### Changes

- Fixed a bug where the tables for the query result-cache would not be created.
- Fixed a bug where the Config parser would still not accept 0 as a value. [#286](https://github.com/Phalcode/gamevault-backend/issues/286)

### Thanks

- @JoaGamo
- @wieluk

## 12.1.0

Recommended Gamevault App Version: `v1.10.0.0`

### Changes

- Support for Pausing and Resuming Downloads by implementing HTTP `Range` Header [#14](https://github.com/Phalcode/gamevault-backend/issues/14)
- Fixed a Bug where deleted bookmarked games would break bookmarking for users who had them bookmarked.
- Formatted imports in entire codebase and refactored project structure
- Made Rotating File logger handle TESTING_MOCK_FILES environment variable
- Fixed a bug where the Config parser would not accept 0 as a value. [#286](https://github.com/Phalcode/gamevault-backend/issues/286)
- Added support for TLS Encrypted Postgres connections [#285](https://github.com/Phalcode/gamevault-backend/issues/285)
- Support for [Rawg2Steam](https://github.com/Phalcode/rawg-to-steam-redirect) API (Removed Reliance on Rawg IDs and their API KEY, and implemented support for RawgToSteam Box Images)

### Thanks

- @wieluk
- @hostmatic

## 12.0.0

Recommended Gamevault App Version: `v1.9.2.0`

### Changes

- Implemented Bookmarking. Users can now bookmark games and filter by them.
- Removed Deprecated API Routes.
- Added some database indexes to improve performance
- Refactored Logging
  - HTTP Requests now get logged to console in a better format by default
  - Added more context to each log.
- Bugfix: Duplicate email when creating a user would return extremely unhelpful error messages. [#351](https://github.com/Phalcode/gamevault-app/issues/351)

## 11.0.3

Recommended Gamevault App Version: `v1.8.2.0` or `v1.9.0.0`

### Changes

- Added more verbose logging to RAWG API Calls
- Fixed a bug where the ORM would convert UTC timestamps to localdate and save them in the database [#257](https://github.com/Phalcode/gamevault-backend/issues/257)
- Fixed a bug where the Release Year in the filename would be ignored
- Fixed permissions on container-internal folders, when using PGID and PUID
- Fixed Boolean Env Variables Parsing and added support for more than just "true" and "false", like "0" and "1" etc.

### Thanks

- @nodiaque
- @doctorase

## 11.0.2

Recommended Gamevault App Version: `v1.8.2.0` or `v1.9.0.0`

### Changes

- Build Image now includes auto-created default folders, due to a permissions bug with the /logs folder now being written to by default.

## 11.0.1

Recommended Gamevault App Version: `v1.8.2.0` or `v1.9.0.0`

### Changes

- Fixed a bug where recursive files could not be downloaded. [#269](https://github.com/Phalcode/gamevault-backend/issues/269)
- Set default value for `SERVER_LOG_FILES_ENABLED` to true.

### Thanks

- @Kudjo

## 11.0.0

Recommended Gamevault App Version: `v1.8.2.0` or `v1.9.0.0`

### Breaking Changes & Migration

- Deprecated `/api/users/all`, Admins should just use `/api/users` to get a list of all users. (will be removed in v12)

### Changes

- Fixed a bug where updating a users email, which was set to null, would throw an error.
- Fixed bug where `gvbot_` users were showing up in user list
- Implement `SERVER_DEMO_MODE_ENABLED` to enable/disable demo mode. You wont need this but it will improve the functionality of our demo server.

## 10.3.2

Recommended Gamevault App Version: `v1.8.2.0`

### Changes

- Fix Username Validation not allowing underscores in usernames.

## 10.3.1

Recommended Gamevault App Version: `v1.8.2.0`

### Changes

- Database Migration Hotfix for older servers that have used the old image deduplication algorithm.

## 10.3.0

Recommended Gamevault App Version: `v1.8.2.0`

### Changes

- Fixed a bug where not all frames of uploaded .gif images would be saved to the filesystem.
- Fixed deleted sub-entities being returned in /api/games/{id}
- You can now mark bot users for API access, that are hidden from the public user list, by prefixing usernames with `gvbot_`.
- The first registered user is now granted automatically granted admin privileges
- Enhanced logs within the RAWG GameMatcher
- Adjusted the Image Garbage Collector to be less aggressive, now exclusively deleting files with filenames starting with a valid UUID4
- Huge Performance Improvement of /game/:id up to 1000% faster for slow-loading games. (they loaded up to 4s, now 40ms)

### Thanks

- @lordfransie

## 10.2.0

Recommended Gamevault App Version: `v1.8.1.0`

### Changes

- Reimplented Interval-based Indexing, because of edge-cases where filewatcher was not triggered. [#246](https://github.com/Phalcode/gamevault-backend/issues/246)
- Implemented experimental dynamic plugin loader for GameVault.
  - Theres no standardized format or official documentation yet, but it will come in the future.
  - See [here](https://github.com/Phalcode/gamevault-backend-example-plugins/tree/master) for example plugins. (more coming soon)
  - Added Configuration Variable `PLUGIN_ENABLED` to enable/disable plugins.
  - Added Configuration Variable `PLUGIN_SOURCES` to define plugin sources.
- Fixed Box-Image Search Algortihm.
- Improved Error-Handling for HTTP Errors.

### Thanks

- @Kudjo
- @JoaGamo
- @ozhound
- @RelaxAti0n

## 10.1.0

Recommended Gamevault App Version: `v1.8.1.0`

### Changes

- Reintroduced Image Garbage Collection: Now, unused images are systematically purged from both the database and the file system. [#230](https://github.com/Phalcode/gamevault-backend/issues/230)
- Introduced Configuration Variables `IMAGE_GC_DISABLED` and `IMAGE_GC_INTERVAL_IN_MINUTES`
- Implemented Various Performance Optimizations and did some code cleanup.
- Resolved RAWG-Remap Issue: Now, Box-Art-Search is triggered correctly. [#240](https://github.com/Phalcode/gamevault-backend/issues/240)
- Enhanced Box-Art-Matcher.
- Fixed User Creation Bug: The server can now create multiple users with a blank email.
- Added Configuration Variable `RAWG_API_INCLUDED_PLATFORMS` to customize which platforms are included in RAWG API requests by default. [#239](https://github.com/Phalcode/gamevault-backend/issues/239)
- Allowed to pass 0 to `RAWG_API_INCLUDED_PLATFORMS` and `RAWG_API_INCLUDED_STORES` to completely disable filtering on platforms and stores. [#239](https://github.com/Phalcode/gamevault-backend/issues/239)

### Thanks

- @Jmatt110
- @JoaGamo
- @drustan-hawk

## 10.0.2

Recommended Gamevault App Version: `v1.8.1.0`

### Changes

- Improved RAWG API Matching and Search by deprecating the `RAWG_API_EXCLUDE_STORES` configuration variable in favor of `RAWG_API_INCLUDED_STORES`. [#234](https://github.com/Phalcode/gamevault-backend/issues/234)

### Thanks

- @alexfornuto

## 10.0.1

### Changes

- Fixed Server detecting invalid file names for games in subdirectories

### Thanks

- @Kudjo

## 10.0.0

Recommended Gamevault App Version: `v1.8.0.0`

### Breaking Changes & Migration

- Improved security by discontinuing "Upload via URL" APIs. Clients must now download via URL locally first and then uploading it via the API if they want to offer the functionality.

### Changes

- Improved Genre and Tags API speed for a smoother user experience.

- Implemented advanced filtering logic using AND and OR operators in the API. For details, refer to [this link](https://github.com/ppetzold/nestjs-paginate/issues/402).

- Replaced the scheduled timer with a debounced file-watcher for indexing, enhancing efficiency and responsiveness.

- Intelligently saved the file's release year when no Release-Year is specified in the filename, but information is available from RAWG.

- Introduced a detection mechanism for the `LINUX_PORTABLE` game type, ensuring seamless identification through the `(L_P)` flag or the presence of `.sh` files in the `/files` directory.

- Changed RAWG Search API Release date to be null instead of 01.01.1970 when no release date is defined in RAWG.

- Updated `/games` to return background images for better display in various clients.

- Fixed a bug where the `SERVER_MAX_DOWNLOAD_BANDWIDTH_IN_KBPS` config would not be used.

- Default `SERVER_MAX_DOWNLOAD_BANDWIDTH_IN_KBPS` is now unlimited.

- `SERVER_REGISTRATION_DISABLED` no longer blocks registration calls by administrators. [#221](https://github.com/Phalcode/gamevault-backend/issues/221)

- Fixed initial folder generation not occurring.

- Fixed Server indexing games with invalid filenames. [#281](https://github.com/Phalcode/gamevault-app/issues/281)

- Reintroduced `SERVER_PORT` environment variable for native installations.

- RAWG API Key is now redacted by default.

- Server logs redacted config in info level by default to aid troubleshooting users.

### Thanks

- @RIPSAW
- @utlilb
- @JoaGamo
- @TechSide

## 9.0.5

Recommended Gamevault App Version: `v1.7.3.0`

### Changes

- Updated Dependencies

## 9.0.4

Recommended Gamevault App Version: `v1.7.3.0`

### Changes

- Fixed Server not finding users with only deleted progresses
- Fixed `GET /api/genres` not returning list of genres sorted descending by count of games

### Thanks

- @MobileManiC

## 9.0.3

Recommended Gamevault App Version: `v1.7.3.0`

### Changes

- Fixed Backup and Restore not working anymore
- Fixed Admin Password reset not working anymore

### Thanks

- @Kudjo

## 9.0.2

Recommended Gamevault App Version: `v1.7.3.0`

### Changes

- Fixed Socket-Secret migration for POSTGRES Users that i broke in v9.0.1.

### Thanks

- @Kudjo
- @sandstormman

## 9.0.1

Recommended Gamevault App Version: `v1.7.3.0`

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

Recommended Gamevault App Version: `v1.7.0.0`

### Changes

- Fixed Bug of 8.0.2 that using no filters at all would crash the server

## 8.0.2

Recommended Gamevault App Version: `v1.7.0.0`

### Changes

- Fixed Bug [#268](https://github.com/Phalcode/gamevault-app/issues/268) where your games could not be filtered based on their tags and genres.
- Also made Tags API faster by limiting pages to 100 results by default.

## 8.0.1

Recommended Gamevault App Version: `v1.7.0.0`

### Changes

- Fixed initial Database Setup not happening
- Increased stability of some migrations

## 8.0.0

Recommended Gamevault App Version: `v1.7.0.0`

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

Recommended Gamevault App Version: `v1.6.1.0`

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

Recommended Gamevault App Version: `v1.6.0.0`

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

Recommended Gamevault App Version: `v1.5.0.0`

### Changes

- Fixed Broken Database Migrations

### Thanks

- @Kudjo

## 5.0.1

Recommended Gamevault App Version: `v1.5.0.0`

### Changes

- Fixed Error when mapping RAWG Games that have no background_image.
- Fixed Error when downloading Games that have special Characters in their name.

## 5.0.0

Recommended Gamevault App Version: `v1.5.0.0`

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
