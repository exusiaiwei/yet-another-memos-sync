<div align="center"><a name="readme-top"></a>

# 🗂️ Yet Another Memos Sync

An enhanced Obsidian plugin for synchronizing Memos with daily notes, featuring emoji timeline and intelligent formatting. 📝

**English** · [简体中文](./README.zh-CN.md) · [GitHub Repository][github-repo-link] · [Community Plugin][community-plugin-link]

[github-repo-link]: https://github.com/exusiaiwei/yet-another-memos-sync
[community-plugin-link]: https://obsidian.md/plugins?search=yet%20another%20memos%20sync

</div>

## Table of Contents

- [🗂️ Yet Another Memos Sync](#️-yet-another-memos-sync)
  - [Table of Contents](#table-of-contents)
  - [Background](#background)
  - [Features](#features)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Usage](#usage)
  - [Visual Formats](#visual-formats)
  - [Development](#development)
  - [Contributing](#contributing)
  - [License](#license)

## Background

**Yet Another Memos Sync** is an enhanced Obsidian plugin that seamlessly synchronizes your [Memos](https://usememos.com/) with daily notes. Inspired by the original [obsidian-memos-sync](https://github.com/RyoJerryYu/obsidian-memos-sync) plugin, this version offers advanced features including emoji timeline, intelligent formatting, and robust synchronization strategies.

Unlike basic sync tools, it provides visual enhancements, smart synchronization, and supports both modern and legacy Memos API versions.

## Features

### 🔄 **Smart Synchronization**

- **Incremental sync** - Only updates changed content for better performance
- **Time-limited sync** - Configurable day limits (default: 30 days) to control sync scope
- **Deletion detection** - Automatically removes deleted memos from your notes
- **Auto-sync options** - Startup and periodic synchronization capabilities

### 🎨 **Visual Enhancements**

- **List Callout Style** - Enhanced Markdown lists with emoji timeline (recommended)
- **Callout Format** - Rich card-style presentation for detailed viewing
- **Standard Format** - Clean Markdown lists with emoji enhancements
- **Multi-line support** - Proper indentation handling for complex memo structures

### 🌍 **Internationalization**

- **Full i18n support** - English, Chinese, and extensible language system
- **Auto-detection** - Automatically detects your Obsidian language preference
- **Consistent UI** - Translated settings interface and user messages

### ⚙️ **Flexible Configuration**

- **API version support** - Compatible with Memos v0.25.1 and legacy versions
- **Custom headers** - Configurable memo section headers for organization
- **Attachment handling** - Download and organize memo attachments automatically
- **Daily note integration** - Seamless integration with Daily Notes plugin

## Installation

### Community Plugins (Recommended)

1. Open Obsidian Settings → Community plugins
2. Disable Safe mode if not already disabled
3. Click "Browse" and search for "Yet Another Memos Sync"
4. Install and enable the plugin

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/exusiaiwei/yet-another-memos-sync/releases)
2. Extract the files to `<vault>/.obsidian/plugins/yet-another-memos-sync/`
3. Reload Obsidian and enable the plugin in Settings → Community Plugins

### Build from Source

```bash
# Clone the repository
git clone https://github.com/exusiaiwei/yet-another-memos-sync.git
cd yet-another-memos-sync

# Install dependencies
npm install

# Build the plugin
npm run build
```

## Configuration

### Basic Setup

1. Open **Settings** → **Yet Another Memos Sync**
2. Configure your Memos server:
   - **API URL**: Your Memos server address (e.g., `https://your-memos.com`)
   - **API Token**: Generate from your Memos settings page
   - **API Version**: Select your server version (v0.25.1 recommended)

### Visual Style Selection

Choose one format that best suits your workflow:

- **🎨 List Callout Style**: Enhanced lists with emoji timeline (recommended with [List Callouts plugin](https://github.com/mgmeyers/obsidian-list-callouts))
- **📋 Callout Format**: Rich card-style presentation for detailed viewing
- **📝 Standard Format**: Simple emoji-enhanced Markdown lists

### Advanced Configuration

<details>
<summary><strong>📝 Sync Settings</strong></summary>

- **Sync Days Limit**: Control sync scope (0 = unlimited, default: 30 days)
- **Daily Note Headers**: Customize memo section titles
- **Auto-create Notes**: Automatically create missing daily note files
- **Attachment Folder**: Configure memo attachment storage location

</details>

<details>
<summary><strong>🔄 Auto-Sync Options</strong></summary>

- **Startup Sync**: Automatically sync when Obsidian starts
- **Startup Delay**: Wait time before initial sync (default: 5 seconds)
- **Skip if Synced Today**: Avoid duplicate syncs on the same day
- **Periodic Sync**: Regular interval syncing (0 = disabled)

</details>

## Usage

### Basic Operations

- **🔄 Manual Sync**: Click the sync button in the ribbon or use Command Palette (`Ctrl/Cmd + P` → "Sync Memos")
- **⚡ Force Sync**: Re-sync all memos, ignoring incremental sync cache
- **🤖 Auto Sync**: Automatically syncs on Obsidian startup and at periodic intervals (if enabled)

### Command Palette Commands

- `Yet Another Memos Sync: Sync Memos` - Standard incremental sync
- `Yet Another Memos Sync: Force Sync All Memos` - Complete re-sync
- `Yet Another Memos Sync: Open Settings` - Quick access to plugin settings

## Visual Formats

### 🎨 List Callout Style (Recommended)

The List Callout style creates beautiful, themed memo lists that integrate seamlessly with the [List Callouts plugin](https://github.com/mgmeyers/obsidian-list-callouts):

```markdown
- 🌅 07:30 Morning coffee and planning the day
  - Reviewed project timeline
  - Prepared meeting agenda
- ☀️ 14:20 Productive afternoon work session
- 🌆 18:30 Evening wrap-up and notes review
- 🌙 22:15 Late night reading session
```

*When paired with List Callouts plugin, each time period gets beautiful colored themes*

### 📋 Time Period Mapping

The plugin uses a simplified 4-period emoji system for intuitive time organization:

| **Period** | **Emoji** | **Time Range** | **List Callout Theme** | **Description** |
|------------|-----------|----------------|------------------------|-----------------|
| Early Morning | 🌅 | 05:00-12:00 | `[!info]` Blue | Peaceful dawn hours |
| Noon | ☀️ | 12:00-17:00 | `[!tip]` Green | Energetic daytime |
| Evening | 🌆 | 17:00-21:00 | `[!warning]` Orange | Warm sunset |
| Night | 🌙 | 21:00-05:00 | `[!note]` Purple | Quiet nighttime |

### 🔄 Other Format Examples

#### Callout Format

```markdown
> [!memo] 🌅 07:30 Morning Memo
> Planning the day with coffee ☕
> - Review project timeline
> - Prepare meeting agenda
```

#### Standard Format

```markdown
- 🌅 07:30 Morning coffee and planning
- ☀️ 14:20 Productive work session
- 🌆 18:30 Evening wrap-up
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Development Setup

```bash
# Clone the repository
git clone https://github.com/exusiaiwei/yet-another-memos-sync.git
cd yet-another-memos-sync

# Install dependencies
npm install

# Development mode with auto-rebuild
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Supported Memos Versions

- ✅ **v0.25.1** (Latest, recommended)
- ✅ **v0.24.x** (Fully supported)
- ✅ **v0.23.x** (Fully supported)
- ✅ **v0.22.x** (Fully supported)
- ✅ **v0.21.x** (Fully supported)
- ✅ **Legacy versions** (v0.20 and below)

## Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Report bugs** via [GitHub Issues](https://github.com/exusiaiwei/yet-another-memos-sync/issues)
- 💡 **Suggest features** through [GitHub Discussions](https://github.com/exusiaiwei/yet-another-memos-sync/discussions)
- 🔀 **Submit pull requests** for improvements
- 📖 **Improve documentation** and translations
- 🌟 **Star the repository** to show your support

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Acknowledgments

- Thanks to the original [obsidian-memos-sync](https://github.com/RyoJerryYu/obsidian-memos-sync) plugin for inspiration
- [Memos](https://usememos.com/) for the excellent memo platform
- [Obsidian](https://obsidian.md/) for the powerful note-taking platform
- [List Callouts plugin](https://github.com/mgmeyers/obsidian-list-callouts) for beautiful visual themes

---

<div align="center">

### 💝 Support

If this plugin helps you, consider:

- ⭐ **Star this repository**
- 🐛 **Report issues** to help improve
- 🔀 **Contribute code** or documentation
- 💬 **Share feedback** and suggestions

*Made with ❤️ for the Obsidian community*

</div>