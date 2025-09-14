#!/usr/bin/env node

/**
 * Extract release notes from CHANGELOG.md for a specific version
 */

const fs = require('fs');
const path = require('path');

function extractReleaseNotes(version, language = 'en') {
  const changelogFile = language === 'zh' ? 'CHANGELOG.zh-CN.md' : 'CHANGELOG.md';
  const changelogPath = path.join(__dirname, changelogFile);
  
  if (!fs.existsSync(changelogPath)) {
    console.error(`${changelogFile} not found`);
    process.exit(1);
  }

  const content = fs.readFileSync(changelogPath, 'utf-8');
  const lines = content.split('\n');
  
  // Find the version section
  const versionPattern = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`);
  let startIndex = -1;
  let endIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (versionPattern.test(lines[i])) {
      startIndex = i;
      break;
    }
  }
  
  if (startIndex === -1) {
    console.error(`Version ${version} not found in ${changelogFile}`);
    process.exit(1);
  }
  
  // Find the end of this version section (next ## or end of file)
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## [')) {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    endIndex = lines.length;
  }  // Extract the content between version headers
  const versionContent = lines.slice(startIndex + 1, endIndex)
    .join('\n')
    .trim();

  return versionContent;
}

function generateReleaseNotes(version, changelogContentEn, changelogContentZh) {
  const template = `## 🎉 What's New in ${version}

${changelogContentEn}

---

## 🎉 ${version} 版本新功能

${changelogContentZh}

---

**Installation / 安装方法:**
1. Download the plugin files below / 下载下方的插件文件
2. Extract to your vault's plugins folder: \`<vault>/.obsidian/plugins/yet-another-memos-sync/\` / 解压到你的库的插件文件夹
3. Enable the plugin in Obsidian settings / 在 Obsidian 设置中启用插件

**Requirements / 系统要求:**
- Obsidian v1.0.0 or higher / Obsidian v1.0.0 或更高版本
- Memos server (supports v0.25.1 and legacy versions) / Memos 服务器（支持 v0.25.1 及历史版本）

**Links / 相关链接:**
- 📖 [Documentation / 文档](https://github.com/exusiaiwei/yet-another-memos-sync#readme)
- 🐛 [Report Issues / 报告问题](https://github.com/exusiaiwei/yet-another-memos-sync/issues)
- 💡 [Feature Requests / 功能建议](https://github.com/exusiaiwei/yet-another-memos-sync/discussions)`;

  return template;
}

// Get version from command line argument or package.json
const version = process.argv[2] || require('./package.json').version;

try {
  const changelogContentEn = extractReleaseNotes(version, 'en');
  const changelogContentZh = extractReleaseNotes(version, 'zh');
  const releaseNotes = generateReleaseNotes(version, changelogContentEn, changelogContentZh);
  
  // Write to release_notes.md
  fs.writeFileSync('release_notes.md', releaseNotes, 'utf-8');
  console.log(`Bilingual release notes generated for version ${version}`);
} catch (error) {
  console.error('Error generating release notes:', error.message);
  process.exit(1);
}