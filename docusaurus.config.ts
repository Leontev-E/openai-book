import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'OpenAI Cookbook (RU)',
  url: 'https://openai-book.ru',
  baseUrl: '/',
  favicon: 'img/favicon.ico',

  i18n: {
    defaultLocale: 'ru',
    locales: ['ru'],
  },

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  stylesheets: [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: require.resolve('./sidebars.ts'),
          exclude: [
            'cookbook/examples/**',
            'cookbook/articles/techniques_to_improve_reliability.md',
            'cookbook/articles/what_is_new_with_dalle_3.mdx',
          ],
        },
        blog: false,
        theme: { customCss: require.resolve('./src/css/custom.css') },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'OpenAI Cookbook',
      items: [
        { to: '/docs/cookbook/', label: 'База знаний', position: 'left' },
        { to: '/about-license', label: 'Об источнике', position: 'right' },
      ],
    },
  },
};

export default config;
