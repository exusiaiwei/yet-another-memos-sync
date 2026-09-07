# Changelog

All notable changes to this project will be documented in this file.

## [1.8.0] - 2026-09-07

### 🎉 Added

- Add local time records through a multiline dialog, with an optional separate heading (blank by default), time-of-day emoji, daily-note creation, and automatic navigation to the new record.

### 🔧 Fixed

- Match sync headings exactly and preserve adjacent sections without trimming or overlapping their content; serialize file updates to avoid stale sync writes.
- Refresh Memos compatibility guidance and generate the Obsidian minimum version from the manifest in release notes.


## [1.7.1] - 2026-09-01

### 🔧 Fixed

- **Mobile installation blocked**: Changed the plugin manifest to declare mobile compatibility. The plugin can now be installed and enabled on Android and iOS, where its Obsidian APIs and `requestUrl`-based sync already work.

## [1.7.0] - 2026-08-09

### Changed

- **Requires Obsidian 1.13.0+**: `minAppVersion` raised to 1.13.0 to adopt the declarative settings API (`getSettingDefinitions()`). Settings now appear in Obsidian's global settings search.
- **Settings UI migrated to the declarative API**: the settings tab is now defined declaratively (requires 1.13.0). Profile cards are replaced by a compact list — click a profile to edit it in a modal, use the delete button or Delete key to remove one, and the "+" button to add a new account.
- **Destructive button styling**: profile-removal confirmation and delete buttons now use `setDestructive()` instead of the deprecated `setWarning()`.

### Fixed

- **Community plugin scan findings**: removed the forbidden `eslint-disable` for the sentence-case rule (copy moved into translations), replaced `createEl('div')` with `createDiv`, and upgraded the `obsidian` type definitions to 1.13.1 so the `moment` helper is fully typed (clearing the `no-unsafe-*` warnings).
- **Hardcoded strings**: the "Skip Images" setting and the List Callouts hint were hardcoded in Chinese; both are now localized.

## [1.6.2] - 2026-08-08

### Fixed

- **Sync completely broken on memos v0.30+**: memos v0.30 changed CEL time-filter semantics — `created_ts` is now a CEL `timestamp` and comparing it against a bare epoch integer fails with HTTP 400 (`no matching overload for '_>_' applied to '(timestamp, int)'`). The plugin now detects this and automatically retries without the server-side filter (local time-window filtering still applies), restoring sync on both new and old memos servers.
- **Unhelpful, flash-by error notices**: Sync failures flashed in the corner and were easy to miss. Failures now stay on screen for 10 seconds, are written to a persistent log file (`.obsidian/plugins/yet-another-memos-sync/yams-sync-error.log`), and are viewable via a new "View sync error log" command. Uncaught errors and unhandled promise rejections are captured too.
- **Crash on unexpected API response**: A non-JSON or malformed `/api/v1/memos` response could throw "Cannot read properties of undefined". It now logs the response body and returns an empty page instead of crashing.
- **Profile attribution in errors**: Sync errors now include which profile failed, making multi-account setups easier to debug.

## [1.6.1] - 2026-05-13

### Changed

- Fixes to clear the Obsidian community plugin store automated review:
  - Replaced `fetch` with Obsidian's `requestUrl`, so network requests no longer hit CORS limits and the plugin now works on mobile as well as desktop.
  - Replaced raw HTML headings in the settings tab with `new Setting(el).setName(...).setHeading()` for consistent UI styling.
  - Replaced the browser `confirm()` dialog used for profile deletion with a native Obsidian `Modal`.
  - Use Obsidian's bundled `moment` export everywhere instead of reading `window.moment`.
  - Dropped raw `localStorage` access; the legacy v1.5.x sync-state migration via `localStorage` was already completed in 1.6.0, so it has been removed.
  - Replaced the deprecated `builtin-modules` npm package with Node's built-in `node:module#builtinModules`.
  - Release workflow now generates a GitHub artifact attestation (`actions/attest-build-provenance@v2`) for `main.js`, `manifest.json`, and `styles.css`.
  - Removed several unused imports and variables (`PersistedData`, `moment` re-import, `otherLines`, `prefix`).

### Note

- Users upgrading **directly** from 1.5.x to 1.6.1 (skipping 1.6.0) will see one extra full sync after the upgrade because the legacy `localStorage` sync timestamp is no longer read. No data is lost; subsequent syncs revert to incremental.

## [1.6.0] - 2026-05-06

### Added

- **Multi-Profile Sync**: Configure multiple Memos accounts/instances and sync them all into the same vault. Each profile writes to its own daily-note section so accounts never collide. Useful for syncing several family or team members' memos side-by-side.
- **CEL Filter for Incremental Sync**: Incremental sync now passes `created_ts > <lastSyncTime>` to the server, so only new memos are returned over the wire instead of fetching everything and filtering on the client.

### Fixed

- **Pagination Truncation (data loss)**: The previous client capped sync at 1000 memos because `pageToken` was incorrectly populated with a numeric offset. Vaults with more than 1000 memos silently lost history. Sync now follows `nextPageToken` until exhausted.
- **Missing Attachments on v0.27+**: Memos v0.27 renamed `resources` to `attachments`. The plugin now reads `attachments` first and falls back to the legacy fields for older servers.
- **Startup setTimeout Leak**: The auto-sync startup timer was not cleared on plugin unload.

### Changed

- **Sync State Storage**: Last-sync timestamp moved from `localStorage` into plugin data, so Obsidian Sync replicates state across devices instead of each machine starting from scratch.
- **API Client**: Dropped the API-version dropdown. The plugin now always targets `/api/v1/memos`, simplifying the codebase. Existing settings migrate automatically into a default profile.

## [1.5.0] - 2026-02-23

### Added

- **Skip Images Option**: New toggle in settings to skip image resources during sync, preventing image files from polluting the Obsidian vault
- When enabled, only non-image resources are included in synced memos
- Image resources with `type` containing "image" are filtered out

## [1.4.2] - 2025-09-14

### 🚨 Critical Fix

- **CRITICAL:** Fixed smart sync deleting existing memos during incremental synchronization
- Smart sync now correctly preserves existing memos and only adds new content

## [1.4.1] - 2025-09-14

### Improved

- **List Callout Format Enhancement**: Multi-line content now automatically merges into single line with space separation for perfect List Callout plugin visual effect. Tags and timestamps naturally appear at the end of content.

## [1.4.0] - 2025-09-14

### Added

- **Smart Sync**: New intelligent sync mode that automatically detects whether to perform incremental or full sync
- **Todo State Preservation**: 🎯 **IMPORTANT** - Sync now intelligently preserves local todo completion states (- [ ] → - [x]) when merging with remote content
- **Three Sync Modes**:
  - Smart Sync (default): Automatically chooses between incremental and full sync
  - Incremental Sync: Only syncs new memos since last sync
  - Force Sync: Complete resync of all memos, overwriting local changes

### Fixed

- **Incremental Sync Logic**: Fixed issue where incremental sync wasn't working properly - now only processes memos newer than last sync time
- **Sync Efficiency**: Improved sync performance by properly filtering memos at API level instead of processing all memos

### Changed

- **Default Sync Behavior**: Changed default sync command to use Smart Sync for better user experience
- **Command Names**: Updated command names to be more descriptive of their actual behavior

## [1.3.1] - 2024-09-14

### Fixed

- **Settings Real-time Update**: Fixed issue where changing memos header settings required plugin restart to take effect. Now settings changes are applied immediately.

## [1.1.0] - 2024-09-14

### Added

- **Create Missing Daily Notes Setting**: New toggle to control whether to automatically create missing daily note files
- **Improved Multi-line Support**: Better handling of multi-line memos with proper indentation
- **Enhanced Configuration**: More granular control over sync behavior

### Fixed

- **Multi-line Content Formatting**: Fixed issue where multi-line content was not properly formatted as lists
- **Indentation Issues**: Changed from tab-based to space-based indentation for better Markdown compatibility

### Changed

- Multi-line content now uses proper 2-space indentation instead of tabs
- Added option to disable automatic creation of daily note files

## [1.0.0] - 2024-09-13

### Features

- Initial release with modern TypeScript architecture
- Emoji timeline feature with time-based emojis
- Internationalization support (English/Chinese)
- Smart sync with deletion detection
- Support for Memos v0.25.1 and earlier versions
- Flexible API version configuration
