import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'PENAI Cookbook (RU)',
  url: 'https://penai-book.ru',
  baseUrl: '/',
  favicon: 'img/favicon.ico',

  i18n: {
    defaultLocale: 'ru',
    locales: ['ru'],
  },

  // Важный блок: preset "classic"
  presets: [
    [
      'classic',
      {
        docs: {
          // путь к вашему sidebars.ts
          sidebarPath: require.resolve('./sidebars.ts'),
          // корень docs уже настроен по умолчанию
        },
        blog: false, // блог не нужен
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'PENAI Cookbook',
      items: [
        { to: '/docs/cookbook/', label: 'Cookbook', position: 'left' },
        { to: '/about-license', label: 'Об источнике', position: 'right' },
      ],
    },
  },
};

export default config;
