import type { AstroIntegration } from 'astro';
import type { LocaleConfig, PageEntry } from './types';

interface I18nRoutesOptions {
  config: LocaleConfig;
  pages: Record<string, PageEntry>;
}

/**
 * Astro integration that automatically injects locale routes
 * for all static pages using injectRoute, and configures
 * Astro's built-in i18n settings from the shared config.
 */
export function createI18nIntegration(options: I18nRoutesOptions): AstroIntegration {
  const { config, pages } = options;

  return {
    name: 'i18n-routes',
    hooks: {
      'astro:config:setup': ({ injectRoute, updateConfig }) => {
        updateConfig({
          i18n: {
            defaultLocale: config.defaultLocale,
            locales: [...config.locales] as any,
            routing: {
              prefixDefaultLocale: false,
              redirectToDefaultLocale: true,
              fallbackType: 'redirect',
            },
          },
        });

        for (const locale of config.locales) {
          if (locale === config.defaultLocale) continue;

          for (const [canonicalName, page] of Object.entries(pages)) {
            const localizedSlug = page.slugs[locale] ?? canonicalName;

            // Homepage: pattern is just the locale prefix
            const pattern = canonicalName === 'index'
              ? `/${locale}`
              : `/${locale}/${localizedSlug}`;

            injectRoute({
              pattern,
              entrypoint: page.entrypoint,
              prerender: true,
            });
          }
        }
      },
    },
  };
}
