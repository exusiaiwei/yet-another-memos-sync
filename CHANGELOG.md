# Changelog

All notable changes to this project will be documented in this file.

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
