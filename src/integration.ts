import type { AstroIntegration } from 'astro';
import type { ContentRouteConfig, LocaleConfig, PageEntry } from './types.js';

interface I18nRoutesOptions {
  config: LocaleConfig;
  pages: Record<string, PageEntry>;
  contentRoutes?: Record<string, ContentRouteConfig>;
}

/**
 * Astro integration that automatically injects locale routes
 * for all static pages using injectRoute, and configures
 * Astro's built-in i18n settings from the shared config.
 */
export function createI18nIntegration(options: I18nRoutesOptions): AstroIntegration {
  const { config, pages, contentRoutes } = options;

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

        // Inject content collection routes for ALL locales via virtual entrypoints
        if (contentRoutes) {
          for (const [routeKey, routeConfig] of Object.entries(contentRoutes)) {
            for (const locale of config.locales) {
              const prefix = routeConfig.prefixes[locale] ?? routeKey;
              const pattern = locale === config.defaultLocale
                ? `/${prefix}/[...slug]`
                : `/${locale}/${prefix}/[...slug]`;

              injectRoute({
                pattern,
                entrypoint: `virtual:content-route/${routeKey}/${locale}`,
                prerender: true,
              });
            }
          }
        }
      },
    },
  };
}
