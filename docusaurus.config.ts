// docusaurus.config.ts
import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'PENAI Cookbook (RU)',
  url: 'https://openai-book.ru',   // ← тут новый домен
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  i18n: { defaultLocale: 'ru', locales: ['ru'] },

  presets: [
    [
      'classic',
      {
        docs: { sidebarPath: require.resolve('./sidebars.ts') },
        blog: false,
        theme: { customCss: require.resolve('./src/css/custom.css') },
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
