import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'OpenAI Cookbook (RU)',
  url: 'https://openai-book.ru',
  baseUrl: '/',
  favicon: 'img/favicon.ico',

  i18n: {
    defaultLocale: 'ru',
    locales: ['ru'],
  },

  // не падаем на временно отсутствующих ссылках
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Шрифт Inter
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
          // исключаем "examples" и 2 проблемные статьи (вернёшь позже)
          exclude: [
            'cookbook/examples/**',
            'cookbook/articles/techniques_to_improve_reliability.md',
            'cookbook/articles/what_is_new_with_dalle_3.mdx',
          ],
          editUrl: undefined,
          showLastUpdateAuthor: false,
          showLastUpdateTime: false,
        },
        blog: false,
        theme: { customCss: require.resolve('./src/css/custom.css') },
      },
    ],
  ],

  // локальный поиск по сайту
  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: 'docs',
        language: ['ru', 'en'],
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    // Детали темы
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
      disableSwitch: false,
    },
    navbar: {
      title: 'OpenAI Cookbook',
      items: [
        { to: '/docs/cookbook/', label: 'Большая энцеклопедия', position: 'left' },
        { to: '/about-license', label: 'Об источнике', position: 'right' },
        // Поиск добавит плагин сам в правую часть
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Разделы',
          items: [
            { label: 'Большая энцеклопедия', to: '/docs/cookbook/' },
            { label: 'Об источнике', to: '/about-license' },
          ],
        },
        {
          title: 'Исходники',
          items: [
            { label: 'Этот сайт (GitHub)', href: 'https://github.com/Leontev-E/openai-book' },
            { label: 'Оригинал (OpenAI Cookbook)', href: 'https://github.com/openai/openai-cookbook' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} • Перевод русской версии. Исходники оригинала — MIT.`,
    },
    prism: {
      theme: prismThemes.github,       // светлая подсветка
      darkTheme: prismThemes.dracula,  // тёмная подсветка
      additionalLanguages: ['bash', 'json', 'python', 'typescript'],
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: false,
      },
    },
  },
};

export default config;
