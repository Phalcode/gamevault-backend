# Crackpipe Backend Server Changelog

## 1.0.0

- Initial Release

### 1.0.4

- Fixed a bug where the first game indexing was skipped.

## 1.1.0

- **BREAKING CHANGE:** Duplicate games must now be saved with a different name format. For example, use `[Texxit]` and `[Hexxit]` in the name: `Minecraft [Texxit] (v1.13) (2011).zip` and `Minecraft [Hexxit] (v1.13) (2011).zip`. Note: Normal parentheses will be ignored. If the wrong Rawg game is detected, you will need to remap them manually.
- Various improvements have been made to indexing, restoring, and updating games.
- Thanks to the use of Node 20 the `/files` directory is now readable recursively, allowing you to create sub-folders in `/files` for better organization.
- Fixed File-Size being returned as a number when SQLITE is being used as Database.
- The Game Indexer now has a failsafe mechanism. If it encounters any incorrect file, it will generate a log and skip it. - Thanks @Zenkiel ❤️
- Images are now optional for registering a user
- Improve Error Logs