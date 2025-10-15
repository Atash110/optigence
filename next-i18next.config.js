/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'az', 'tr', 'es', 'zh', 'de', 'fr', 'ru', 'hi', 'ar'],
    localeDetection: false,
  },
  react: {
    useSuspense: false,
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
