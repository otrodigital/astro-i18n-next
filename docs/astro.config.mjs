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
      },
      social: {
        github: 'https://github.com/otrodigital/astro-i18n-next',
      },
      sidebar: [
        {
          label: 'Getting Started',
          translations: { es: 'Primeros Pasos' },
          items: [
            { slug: 'getting-started/installation' },
            { slug: 'getting-started/quick-start' },
            { slug: 'getting-started/project-structure' },
          ],
        },
        {
          label: 'Guides',
          translations: { es: 'Guías' },
          items: [
            { slug: 'guides/translated-routes' },
            { slug: 'guides/multilingual-content' },
            { slug: 'guides/slug-translation' },
            { slug: 'guides/locale-detection' },
            { slug: 'guides/language-switcher' },
            { slug: 'guides/i18next-plugins' },
          ],
        },
        {
          label: 'API Reference',
          translations: { es: 'Referencia API' },
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
          translations: { es: 'Avanzado' },
          collapsed: true,
          items: [
            { slug: 'advanced/standalone-functions' },
            { slug: 'advanced/custom-i18next-options' },
            { slug: 'advanced/type-safety' },
          ],
        },
      ],
    }),
  ],
});
