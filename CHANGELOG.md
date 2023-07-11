# Crackpipe Backend Server Changelog

## 1.0.0

- Initial Release

### 1.0.4

- Fixed a bug where the first game indexing was skipped.

## 1.1.0

- **BREAKING CHANGE:** When adding the same game multiple times to your Crackpipe server, [follow this documentation.](https://crackpipe.de/docs/server-docs/adding-games#adding-the-same-game-multiple-times)
- Various improvements have been made to indexing, restoring, and updating games.
- Thanks to the use of Node 20 the `/files` directory is now readable recursively, allowing you to create sub-folders in `/files` for better organization.
- Fixed File-Size being returned as a number when SQLITE is being used as Database.
- The Game Indexer now has a failsafe mechanism. If it encounters any incorrect file, it will generate a log and skip it. - Thanks @mhbates ❤️
- Images are now optional for registering a user
- Improve Error Logs

## 1.2.0

- Server inspects mounted folders during startup
- Implemented Docker health checks
- Improved Logging
- Introduced Rolling File Logger with retention period of 14 days
- Boxarts now function autonomously from RAWG
