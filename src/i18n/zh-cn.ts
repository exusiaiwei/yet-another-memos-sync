import { Translations } from './index';

export const zhCnTranslations: Translations = {
  // Plugin info
  PLUGIN_NAME: '又一个 Memos 同步插件',
  PLUGIN_DESCRIPTION: '同步 Memos 到日记并添加时间表情符号',

  // Settings interface
  SETTINGS_TITLE: '又一个 Memos 同步插件设置',
  API_CONFIG_TITLE: 'API 配置',
  SYNC_CONFIG_TITLE: '同步设置',
  AUTO_SYNC_TITLE: '自动同步',

  // API settings
  API_URL_NAME: 'Memos API URL',
  API_URL_DESC: '您的 Memos 服务器地址',
  API_TOKEN_NAME: 'API 令牌',
  API_TOKEN_DESC: '您的 Memos API 访问令牌',
  API_VERSION_NAME: 'API 版本',
  API_VERSION_DESC: '选择您的 Memos 服务器版本',

  // Sync settings
  DAILY_HEADER_NAME: '日记备忘录标题',
  DAILY_HEADER_DESC: '在日记中显示备忘录的标题',
  ATTACHMENT_FOLDER_NAME: '附件存储文件夹',
  ATTACHMENT_FOLDER_DESC: '保存 Memos 附件的文件夹路径',
  CREATE_MISSING_NOTES_NAME: '创建缺失的日记文件',
  CREATE_MISSING_NOTES_DESC: '如果日记文件不存在，自动创建它们',
  USE_CALLOUT_FORMAT_NAME: '使用 Callout 格式',
  USE_CALLOUT_FORMAT_DESC: '将备忘录显示为带时间主题色彩的精美卡片',
  USE_LIST_CALLOUT_FORMAT_NAME: '使用 List Callout 样式',
  USE_LIST_CALLOUT_FORMAT_DESC: '保持标准 Markdown 列表格式，建议安装 List Callouts 插件以获得增强的视觉效果',
  SYNC_DAYS_LIMIT_NAME: '同步天数限制',
  SYNC_DAYS_LIMIT_DESC: '只同步最近 N 天内的备忘录（0 = 无限制）',

  // Auto sync settings
  AUTO_SYNC_STARTUP_NAME: '启动时自动同步',
  AUTO_SYNC_STARTUP_DESC: 'Obsidian 启动时自动同步备忘录',
  STARTUP_DELAY_NAME: '启动同步延迟（秒）',
  STARTUP_DELAY_DESC: '启动后延迟多少秒开始同步',
  SKIP_IF_SYNCED_NAME: '今日已同步则跳过',
  SKIP_IF_SYNCED_DESC: '如果今天已经同步过则跳过启动同步',
  PERIODIC_SYNC_NAME: '定期同步间隔（分钟）',
  PERIODIC_SYNC_DESC: '设置为 0 禁用定期同步',

  // Buttons and commands
  SYNC_MEMOS: '智能同步备忘录',
  INCREMENTAL_SYNC_MEMOS: '增量同步（仅新内容）',
  FORCE_SYNC_MEMOS: '强制同步所有备忘录',

  // Notification messages
  SYNC_STARTING: '🌅 开始同步备忘录...',
  SYNC_SUCCESS: '✅ 备忘录同步成功！',
  SYNC_FAILED: '❌ 同步失败',
  FORCE_SYNC_STARTING: '🔄 开始强制同步...',
  FORCE_SYNC_SUCCESS: '✅ 强制同步完成！',
  FORCE_SYNC_FAILED: '❌ 强制同步失败',

  // Error messages
  NETWORK_ERROR: '网络错误: 无法连接到',
  FETCH_MEMOS_ERROR: '无法获取备忘录',
};
