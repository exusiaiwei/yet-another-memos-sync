# 🚀 GitHub Release Instructions for Yet Another Memos Sync v1.3.0

## 📋 Release Checklist

### 1️⃣ Create GitHub Release

1. **Navigate to GitHub Repository**
   ```
   https://github.com/exusiaiwei/yet-another-memos-sync/releases/new
   ```

2. **Release Configuration**
   - **Tag version**: `1.3.0` (no prefix v)
   - **Release title**: `🗂️ Yet Another Memos Sync 1.3.0`
   - **Target**: `master` branch

3. **Release Description**
   ```markdown
   ## 🎉 What's New in v1.3.0

   ### ✨ Major Features
   - 🎨 **Simplified Emoji System**: Streamlined to 4-period emoji timeline (🌅☀️🌆🌙)
   - 📚 **Bilingual Documentation**: Separate Chinese README (README.zh-CN.md)
   - 🤖 **Automated Release Pipeline**: GitHub Actions for CI/CD
   - 🔄 **Enhanced List Callout Format**: Better integration with List Callouts plugin

   ### 🔧 Improvements
   - ⚡ **Performance**: Optimized sync algorithms with time limits
   - 🌍 **Internationalization**: Full i18n support for English and Chinese
   - 📱 **Compatibility**: Lowered minimum Obsidian version to 1.0.0
   - 🎯 **User Experience**: Clearer settings and better error messages

   ### 🐛 Bug Fixes
   - Fixed multi-line memo indentation issues
   - Improved deletion detection reliability
   - Enhanced error handling for network issues
   - Better handling of empty or malformed memos

   ### 📚 Documentation
   - 📖 Complete README rewrite with visual examples
   - 🇨🇳 Chinese translation (README.zh-CN.md)
   - 🎨 Visual format demonstrations
   - 📋 Comprehensive setup and configuration guide

   ---

   ## 🚀 Installation

   ### Method 1: Community Plugins (Recommended)
   1. Open Obsidian Settings → Community plugins
   2. Search for "Yet Another Memos Sync"
   3. Install and enable

   ### Method 2: Manual Installation
   1. Download the files below: `manifest.json`, `main.js`, `styles.css`
   2. Create folder: `<vault>/.obsidian/plugins/yet-another-memos-sync/`
   3. Extract files to the folder
   4. Reload Obsidian and enable the plugin

   ## 📋 Requirements
   - **Obsidian**: v1.0.0 or higher
   - **Memos**: Supports v0.25.1 and legacy versions
   - **Optional**: [List Callouts plugin](https://github.com/mgmeyers/obsidian-list-callouts) for enhanced visuals

   ## 🔗 Links
   - 📖 [Documentation](https://github.com/exusiaiwei/yet-another-memos-sync)
   - 🇨🇳 [中文文档](https://github.com/exusiaiwei/yet-another-memos-sync/blob/master/README.zh-CN.md)
   - 🐛 [Issues](https://github.com/exusiaiwei/yet-another-memos-sync/issues)
   - 💬 [Discussions](https://github.com/exusiaiwei/yet-another-memos-sync/discussions)

   ---

   **Full Changelog**: https://github.com/exusiaiwei/yet-another-memos-sync/commits/1.3.0
   ```

4. **Upload Files** (Binary attachments)
   - ✅ `manifest.json`
   - ✅ `main.js`
   - ✅ `styles.css`

5. **Release Settings**
   - ❌ Set as pre-release
   - ❌ Set as latest release
   - ✅ Create a discussion for this release

### 2️⃣ Verification Steps

After creating the release:

1. **Check Release Page**
   ```
   https://github.com/exusiaiwei/yet-another-memos-sync/releases/tag/1.3.0
   ```

2. **Verify Files**
   - Ensure all 3 files are attached
   - Test download links work
   - Check file sizes are reasonable

3. **Test Installation**
   - Download files to test vault
   - Verify plugin loads correctly
   - Test basic sync functionality

## 🎯 Post-Release Actions

1. **Update Community Plugin Request**
   - Prepare for obsidian-releases PR
   - Ensure README.md is in repository root
   - Verify plugin guidelines compliance

2. **Social Media & Community**
   - Share on Obsidian Discord
   - Post in relevant Reddit communities
   - Update personal documentation

## 📝 Notes

- **Tag Format**: Use `1.3.0` (no 'v' prefix) as specified in Obsidian guidelines
- **File Requirements**: manifest.json must be both in repository root AND release assets
- **Description**: Rich markdown with emojis for better visibility
- **Version**: Matches manifest.json and package.json (1.3.0)
