# Changelog

All notable changes to this project will be documented in this file.

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
