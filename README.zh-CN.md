<div align="center"><a name="readme-top"></a>

# 🗂️ Yet Another Memos Sync

一个优雅且强大的 Obsidian Memos 同步插件，具有表情时间线和智能格式化功能。 📝

**[English](./README.md)** · **简体中文** · [GitHub 仓库][github-repo-link] · [社区插件][community-plugin-link]

[github-repo-link]: https://github.com/exusiaiwei/yet-another-memos-sync
[community-plugin-link]: https://obsidian.md/plugins?search=yet%20another%20memos%20sync

</div>

## 目录

- [🗂️ Yet Another Memos Sync](#️-yet-another-memos-sync)
  - [目录](#目录)
  - [项目介绍](#项目介绍)
  - [核心特性](#核心特性)
  - [安装方法](#安装方法)
  - [配置说明](#配置说明)
  - [使用方法](#使用方法)
  - [视觉格式展示](#视觉格式展示)
  - [开发](#开发)
  - [参与贡献](#参与贡献)
  - [许可证](#许可证)

## 项目介绍

**Yet Another Memos Sync** 是一个功能丰富的 Obsidian 插件，可无缝同步您的 [Memos](https://usememos.com/) 到日记中。受到原始 [obsidian-memos-sync](https://github.com/RyoJerryYu/obsidian-memos-sync) 插件的启发，此版本提供了表情时间线、智能格式化和稳健的同步策略等高级功能。

与基础同步工具不同，它提供视觉增强、智能同步，并支持现代和传统的 Memos API 版本。

## 核心特性

### 🔄 **智能同步**

- **增量同步** - 仅更新变更内容，提升性能
- **时间限制同步** - 可配置天数限制（默认：30天）控制同步范围
- **删除检测** - 自动从笔记中移除已删除的备忘录
- **自动同步选项** - 启动和定期同步功能

### 🎨 **视觉增强**

- **List Callout 样式** - 增强的 Markdown 列表与表情时间线（推荐）
- **Callout 格式** - 丰富的卡片式展示，便于详细查看
- **标准格式** - 简洁的表情增强 Markdown 列表
- **多行支持** - 正确处理复杂备忘录结构的缩进

### 🌍 **国际化支持**

- **完整的 i18n 支持** - 英文、中文和可扩展的语言系统
- **自动检测** - 自动检测您的 Obsidian 语言偏好
- **一致的界面** - 翻译的设置界面和用户消息

### ⚙️ **灵活配置**

- **API 版本支持** - 兼容 Memos v0.25.1 和历史版本
- **自定义标题** - 可配置备忘录区块标题用于组织
- **附件处理** - 自动下载和整理备忘录附件
- **日记集成** - 与日记插件无缝集成

## 安装方法

### 社区插件（推荐）

1. 打开 Obsidian 设置 → 社区插件
2. 如果尚未禁用，请禁用安全模式
3. 点击"浏览"并搜索 "Yet Another Memos Sync"
4. 安装并启用插件

### 手动安装

1. 从 [GitHub Releases](https://github.com/exusiaiwei/yet-another-memos-sync/releases) 下载最新版本
2. 解压文件到 `<库>/.obsidian/plugins/yet-another-memos-sync/`
3. 重新加载 Obsidian 并在设置 → 社区插件中启用

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/exusiaiwei/yet-another-memos-sync.git
cd yet-another-memos-sync

# 安装依赖
npm install

# 构建插件
npm run build
```

## 配置说明

### 基础设置

1. 打开**设置** → **Yet Another Memos Sync**
2. 配置您的 Memos 服务器：
   - **API URL**: Memos 服务器地址（如：`https://your-memos.com`）
   - **API 令牌**: 从 Memos 设置页面生成
   - **API 版本**: 选择您的服务器版本（推荐 v0.25.1）

### 视觉样式选择

选择最适合您工作流程的格式：

- **🎨 List Callout 样式**: 增强列表与表情时间线（推荐配合 [List Callouts 插件](https://github.com/mgmeyers/obsidian-list-callouts)）
- **📋 Callout 格式**: 丰富的卡片式展示，便于详细查看
- **📝 标准格式**: 简单的表情增强 Markdown 列表

### 高级配置

<details>
<summary><strong>📝 同步设置</strong></summary>

- **同步天数限制**: 控制同步范围（0 = 无限制，默认：30天）
- **日记备忘录标题**: 自定义备忘录区块标题
- **自动创建日记**: 自动创建缺失的日记文件
- **附件文件夹**: 配置备忘录附件存储位置

</details>

<details>
<summary><strong>🔄 自动同步选项</strong></summary>

- **启动同步**: Obsidian 启动时自动同步
- **启动延迟**: 初始同步前的等待时间（默认：5秒）
- **今日已同步则跳过**: 避免同一天重复同步
- **定期同步**: 定期间隔同步（0 = 禁用）

</details>

## 使用方法

### 基本操作

- **🔄 手动同步**: 点击工具栏中的同步按钮或使用命令面板（`Ctrl/Cmd + P` → "同步 Memos"）
- **⚡ 强制同步**: 重新同步所有备忘录，忽略增量同步缓存
- **🤖 自动同步**: 在 Obsidian 启动时和定期间隔自动同步（如果启用）

### 命令面板命令

- `Yet Another Memos Sync: Sync Memos` - 标准增量同步
- `Yet Another Memos Sync: Force Sync All Memos` - 完整重新同步
- `Yet Another Memos Sync: Open Settings` - 快速访问插件设置

## 视觉格式展示

### 🎨 List Callout 样式（推荐）

List Callout 样式创建美观、主题化的备忘录列表，与 [List Callouts 插件](https://github.com/mgmeyers/obsidian-list-callouts) 无缝集成：

```markdown
- 🌅 07:30 晨间咖啡和规划一天的工作
  - 回顾了项目时间线
  - 准备了会议议程
- ☀️ 14:20 下午高效的工作时段
- 🌆 18:30 晚间总结和笔记回顾
- 🌙 22:15 深夜阅读时光
```

与 List Callouts 插件搭配使用，每个时间段都有漂亮的彩色主题

### 📋 时间段映射

插件使用简化的 4 时段表情系统进行直观的时间组织：

| **时间段** | **表情** | **时间范围** | **List Callout 主题** | **描述** |
|-----------|----------|-------------|---------------------|---------|
| 早晨 | 🌅 | 05:00-12:00 | `[!info]` 蓝色 | 宁静的黎明时光 |
| 中午 | ☀️ | 12:00-17:00 | `[!tip]` 绿色 | 充满活力的白天 |
| 傍晚 | 🌆 | 17:00-21:00 | `[!warning]` 橙色 | 温暖的日落 |
| 夜晚 | 🌙 | 21:00-05:00 | `[!note]` 紫色 | 安静的夜晚时光 |

### 🔄 其他格式示例

#### Callout 格式

```markdown
> [!memo] 🌅 07:30 晨间备忘录
> 喝咖啡规划一天 ☕
> - 回顾项目时间线
> - 准备会议议程
```

#### 标准格式

```markdown
- 🌅 07:30 晨间咖啡和规划
- ☀️ 14:20 高效工作时段
- 🌆 18:30 晚间总结
```

## 开发

### 前置要求

- Node.js (v16 或更高)
- npm 或 yarn

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/exusiaiwei/yet-another-memos-sync.git
cd yet-another-memos-sync

# 安装依赖
npm install

# 开发模式（自动重建）
npm run dev

# 生产构建
npm run build

# 运行测试
npm test
```

### 支持的 Memos 版本

- ✅ **v0.25.1**（最新，推荐）
- ✅ **v0.24.x**（完全支持）
- ✅ **v0.23.x**（完全支持）
- ✅ **v0.22.x**（完全支持）
- ✅ **v0.21.x**（完全支持）
- ✅ **旧版本**（v0.20 及以下）

## 参与贡献

我们欢迎社区的贡献！您可以通过以下方式参与：

### 贡献方式

- 🐛 **报告问题** 通过 [GitHub Issues](https://github.com/exusiaiwei/yet-another-memos-sync/issues)
- 💡 **建议功能** 通过 [GitHub Discussions](https://github.com/exusiaiwei/yet-another-memos-sync/discussions)
- 🔀 **提交改进** 的拉取请求
- 📖 **改进文档** 和翻译
- 🌟 **为仓库点星** 表示支持

### 开发指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

### 致谢

- 感谢原始 [obsidian-memos-sync](https://github.com/RyoJerryYu/obsidian-memos-sync) 插件的启发
- [Memos](https://usememos.com/) 提供的优秀备忘录平台
- [Obsidian](https://obsidian.md/) 提供的强大笔记平台
- [List Callouts 插件](https://github.com/mgmeyers/obsidian-list-callouts) 提供的漂亮视觉主题

---

<div align="center">

### 💝 支持项目

如果这个插件对您有帮助，请考虑：

- ⭐ **为仓库点星** 表示支持
- 🐛 **报告问题** 帮助改进插件
- 🔀 **贡献代码** 或文档
- 💬 **分享反馈** 和建议

*用 ❤️ 为 Obsidian 社区制作*

</div>
