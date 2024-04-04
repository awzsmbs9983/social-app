/** @type {import('@lingui/conf').LinguiConfig} */
module.exports = {
  locales: [
    'en',
    'de',
    'es',
    'fi',
    'fr',
    'ga',
    'hi',
    'id',
    'ja',
    'ko',
    'pt-BR',
    'uk',
    'ca',
    'zh-CN',
    'zh-TW',
    'it',
    'tr',
  ],
  catalogs: [
    {
      path: '<rootDir>/src/locale/locales/{locale}/messages',
      include: ['src'],
    },
  ],
  format: 'po',
}
