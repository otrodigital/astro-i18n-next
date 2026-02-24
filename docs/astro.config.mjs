import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://astro-i18n-next.otro.digital',
  integrations: [
    starlight({
      title: 'Astro i18n Next',
      description: 'Complete i18n integration for Astro 5 static sites',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        es: {
          label: 'Español',
          lang: 'es',
        },
        fr: {
          label: 'Français',
          lang: 'fr',
        },
        de: {
          label: 'Deutsch',
          lang: 'de',
        },
        pt: {
          label: 'Português',
          lang: 'pt',
        },
        ja: {
          label: '日本語',
          lang: 'ja',
        },
        zh: {
          label: '中文',
          lang: 'zh',
        },
      },
      social: {
        github: 'https://github.com/otrodigital/astro-i18n-next',
      },
      sidebar: [
        {
          label: 'Getting Started',
          translations: {
            es: 'Primeros Pasos',
            fr: 'Démarrage',
            de: 'Erste Schritte',
            pt: 'Primeiros Passos',
            ja: 'はじめに',
            zh: '快速开始',
          },
          items: [
            { slug: 'getting-started/installation' },
            { slug: 'getting-started/quick-start' },
            { slug: 'getting-started/project-structure' },
          ],
        },
        {
          label: 'Guides',
          translations: {
            es: 'Guías',
            fr: 'Guides',
            de: 'Anleitungen',
            pt: 'Guias',
            ja: 'ガイド',
            zh: '指南',
          },
          items: [
            { slug: 'guides/translated-routes' },
            { slug: 'guides/multilingual-content' },
            { slug: 'guides/slug-translation' },
            { slug: 'guides/locale-detection' },
            { slug: 'guides/language-switcher' },
            { slug: 'guides/seo-components' },
            { slug: 'guides/i18next-plugins' },
          ],
        },
        {
          label: 'API Reference',
          translations: {
            es: 'Referencia API',
            fr: 'Référence API',
            de: 'API-Referenz',
            pt: 'Referência API',
            ja: 'APIリファレンス',
            zh: 'API 参考',
          },
          items: [
            { slug: 'reference/configuration' },
            { slug: 'reference/create-i18n' },
            { slug: 'reference/virtual-module' },
            { slug: 'reference/route-helpers' },
            { slug: 'reference/content-loader' },
            { slug: 'reference/middleware' },
            { slug: 'reference/slug-resolver' },
            { slug: 'reference/types' },
          ],
        },
        {
          label: 'Advanced',
          translations: {
            es: 'Avanzado',
            fr: 'Avancé',
            de: 'Fortgeschritten',
            pt: 'Avançado',
            ja: '高度な使い方',
            zh: '高级',
          },
          collapsed: true,
          items: [
            { slug: 'advanced/standalone-functions' },
            { slug: 'advanced/custom-i18next-options' },
            { slug: 'advanced/type-safety' },
          ],
        },
      ],
      components: {
        Head: './src/components/Head.astro',
      },
    }),
  ],
});
