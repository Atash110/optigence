export const defaultLocale = 'en';
export const locales = ['en', 'de', 'es', 'fr', 'az', 'tr', 'zh', 'ru', 'hi', 'ar'] as const;

export type Locale = typeof locales[number];

export const localeNames: { [key in Locale]: string } = {
  en: 'English',
  de: 'Deutsch', 
  es: 'Español',
  fr: 'Français',
  az: 'Azərbaycan',
  tr: 'Türkçe',
  zh: '中文',
  ru: 'Русский',
  hi: 'हिन्दी',
  ar: 'العربية'
};
