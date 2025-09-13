import { detectLanguage, Translations, SupportedLanguage } from './index';
import { enTranslations } from './en';
import { zhCnTranslations } from './zh-cn';

// 所有翻译的映射
const translationsMap: Record<SupportedLanguage, Translations> = {
  'en': enTranslations,
  'zh-cn': zhCnTranslations,
  'zh-tw': zhCnTranslations, // 暂时使用简体中文
  'ja': enTranslations, // 暂时使用英语
  'ko': enTranslations, // 暂时使用英语
  'fr': enTranslations, // 暂时使用英语
  'de': enTranslations, // 暂时使用英语
  'es': enTranslations, // 暂时使用英语
  'ru': enTranslations, // 暂时使用英语
};

// 翻译管理器类
export class TranslationManager {
  private currentLanguage: SupportedLanguage;
  private translations: Translations;

  constructor(forceLanguage?: SupportedLanguage) {
    this.currentLanguage = forceLanguage || detectLanguage();
    this.translations = translationsMap[this.currentLanguage];
  }

  // 获取翻译文本
  t(key: keyof Translations): string {
    return this.translations[key];
  }

  // 获取当前语言
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  // 切换语言
  setLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
    this.translations = translationsMap[language];
  }

  // 带参数的翻译（简单的字符串替换）
  tWithParams(key: keyof Translations, params: Record<string, string>): string {
    let text = this.translations[key];
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(`{${param}}`, value);
    });
    return text;
  }
}

// 创建全局翻译管理器实例
export const t = new TranslationManager();
