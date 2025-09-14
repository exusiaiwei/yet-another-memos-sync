import { moment } from 'obsidian';

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

// 检测Obsidian语言设置
export function detectLanguage(): SupportedLanguage {
  // 获取Obsidian的语言设置
  const obsidianLang = window.app?.vault?.getConfig?.('language') ||
                      (window.moment && window.moment.locale ? window.moment.locale() : null) ||
                      navigator.language ||
                      'en';

  // 标准化语言代码
  const normalizedLang = obsidianLang.toLowerCase().replace('_', '-');

  // 匹配支持的语言
  if (normalizedLang.startsWith('zh-cn') || normalizedLang === 'zh-hans') return 'zh-cn';
  if (normalizedLang.startsWith('zh-tw') || normalizedLang === 'zh-hant') return 'zh-tw';
  if (normalizedLang.startsWith('ja')) return 'ja';
  if (normalizedLang.startsWith('ko')) return 'ko';
  if (normalizedLang.startsWith('fr')) return 'fr';
  if (normalizedLang.startsWith('de')) return 'de';
  if (normalizedLang.startsWith('es')) return 'es';
  if (normalizedLang.startsWith('ru')) return 'ru';

  return 'en'; // 默认英语
}
