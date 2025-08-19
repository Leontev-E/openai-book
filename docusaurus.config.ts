import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'PENAI Cookbook (RU)',
  url: 'https://openai-book.ru',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  i18n: { defaultLocale: 'ru', locales: ['ru'] },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: require.resolve('./sidebars.ts'),
          // <<< ВАЖНО: не собирать примеры пока
          exclude: ['cookbook/examples/**'],
        },
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
