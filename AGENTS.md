# GameVault Backend — Changelog Workflow

When you change code in this repository, you MUST keep `CHANGELOG.md` up to date.

## Rules

1. **User-facing changes → add an entry.**
   If a change is relevant to end users (new feature, bug fix, config/API change, behavior change, or a security fix), add an entry to the `### Changes` list under the current version heading (`## <version>`) in `CHANGELOG.md`.

2. **Only user-facing changes.**
   Skip internal refactors, tests, formatting/lint, or purely internal plumbing unless it changes how users interact with the server.

3. **Write it for users.**
   Describe the user-visible effect, not the implementation. Keep it to one line when possible. Add issue links when known:
   `- [#123](https://github.com/Phalcode/gamevault-backend/issues/123) Fixed ...`

4. **Breaking changes → `### Breaking Changes & Migration`.**
   If a change breaks existing behavior, config, data, or API compatibility, put the entry under a `### Breaking Changes & Migration` heading in the current version section (create the heading if it does not exist).

   Match the existing backend style exactly: each entry describes what changed and ends in a bold migration/action hint after an arrow.
   `- <what changed>. -> **<what users must do, or what is migrated automatically>.**`

   Example:
   `- Duplicate handling now merges same-title files into one game entity. -> **If you relied on same-title duplicates, rename titles explicitly to keep them separate.**`

5. **Thank issue contributors.**
   When a change resolves an issue, add the issue author's GitHub username (e.g. `@some-user`) to the `### Thanks` list in the current version section (create the heading if it does not exist). Keep the list deduplicated — one line per contributor, no repeats.

   Never add the maintainer accounts `@Alfagun74` or `@Yelo420` to the list — they are project maintainers, not contributors.
