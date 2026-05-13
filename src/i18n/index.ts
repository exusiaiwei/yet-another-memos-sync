// 支持的语言代码
export type SupportedLanguage = 'en' | 'zh-cn' | 'zh-tw' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru';

// 翻译文本接口
export interface Translations {
  // 插件设置
  PLUGIN_NAME: string;
  PLUGIN_DESCRIPTION: string;

  // 设置界面
  SETTINGS_TITLE: string;
  API_CONFIG_TITLE: string;
  SYNC_CONFIG_TITLE: string;
  AUTO_SYNC_TITLE: string;

  // API设置
  API_URL_NAME: string;
  API_URL_DESC: string;
  API_TOKEN_NAME: string;
  API_TOKEN_DESC: string;
  API_VERSION_NAME: string;
  API_VERSION_DESC: string;

  // Profiles
  PROFILES_TITLE: string;
  PROFILES_DESC: string;
  PROFILE_NAME_LABEL: string;
  PROFILE_NAME_DESC: string;
  PROFILE_ENABLED_LABEL: string;
  ADD_PROFILE: string;
  REMOVE_PROFILE: string;
  REMOVE_PROFILE_CONFIRM: string;
  NO_PROFILES_HINT: string;

  // 同步设置
  DAILY_HEADER_NAME: string;
  DAILY_HEADER_DESC: string;
  ATTACHMENT_FOLDER_NAME: string;
  ATTACHMENT_FOLDER_DESC: string;
  CREATE_MISSING_NOTES_NAME: string;
  CREATE_MISSING_NOTES_DESC: string;
  USE_CALLOUT_FORMAT_NAME: string;
  USE_CALLOUT_FORMAT_DESC: string;
  USE_LIST_CALLOUT_FORMAT_NAME: string;
  USE_LIST_CALLOUT_FORMAT_DESC: string;
  SYNC_DAYS_LIMIT_NAME: string;
  SYNC_DAYS_LIMIT_DESC: string;

  // 自动同步设置
  AUTO_SYNC_STARTUP_NAME: string;
  AUTO_SYNC_STARTUP_DESC: string;
  STARTUP_DELAY_NAME: string;
  STARTUP_DELAY_DESC: string;
  SKIP_IF_SYNCED_NAME: string;
  SKIP_IF_SYNCED_DESC: string;
  PERIODIC_SYNC_NAME: string;
  PERIODIC_SYNC_DESC: string;

  // 按钮和命令
  SYNC_MEMOS: string;
  INCREMENTAL_SYNC_MEMOS: string;
  FORCE_SYNC_MEMOS: string;

  // 通知消息
  SYNC_STARTING: string;
  SYNC_SUCCESS: string;
  SYNC_FAILED: string;
  FORCE_SYNC_STARTING: string;
  FORCE_SYNC_SUCCESS: string;
  FORCE_SYNC_FAILED: string;

  // 错误消息
  NETWORK_ERROR: string;
  FETCH_MEMOS_ERROR: string;
}

// 检测Obsidian语言设置：优先看 moment.locale()（Obsidian会在启动时同步设置）
// 然后退回到浏览器 navigator.language。两者都是公开 API，避免直接读 vault 配置。
export function detectLanguage(momentLocale: string | undefined): SupportedLanguage {
  const candidate = momentLocale || (typeof navigator !== 'undefined' ? navigator.language : 'en');
  const normalized = candidate.toLowerCase().replace('_', '-');

  if (normalized.startsWith('zh-cn') || normalized === 'zh-hans') return 'zh-cn';
  if (normalized.startsWith('zh-tw') || normalized === 'zh-hant') return 'zh-tw';
  if (normalized.startsWith('ja')) return 'ja';
  if (normalized.startsWith('ko')) return 'ko';
  if (normalized.startsWith('fr')) return 'fr';
  if (normalized.startsWith('de')) return 'de';
  if (normalized.startsWith('es')) return 'es';
  if (normalized.startsWith('ru')) return 'ru';

  return 'en';
}
