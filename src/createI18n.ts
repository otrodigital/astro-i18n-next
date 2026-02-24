import { join } from 'node:path';
import type { I18nConfig, PageEntry, SlugMap } from './types.js';
import type { AstroIntegration } from 'astro';
import { createI18nIntegration } from './integration.js';
import { loadPageMapSync } from './pageMapLoader.js';
import { loadSlugMapSync } from './slugMapLoader.js';

/**
 * Creates a fully configured i18n Astro integration from a single config object.
 *
 * Returns an `AstroIntegration` that:
 * - Injects localized routes for all static pages
 * - Provides a `virtual:i18n` module that components can import from
 *
 * Usage in `astro.config.mjs`:
 * ```js
 * export default defineConfig({
 *   integrations: [createI18n({ ... })],
 * });
 * ```
 *
 * Usage in components:
 * ```astro
 * import { t, localePath, locales } from 'virtual:i18n';
 * ```
 */
export function createI18n(config: I18nConfig): AstroIntegration {
  const slugMaps: Record<string, SlugMap> = { ...(config.slugMaps ?? {}) };
  let pages: Record<string, PageEntry> = {};

  // Auto-discover page slugs from .astro files
  if (config.pagesDir) {
    const result = loadPageMapSync(config.pagesDir, config.locales);
    pages = result.pages;
    slugMaps.pages = result.pageSlugMap;
  }

  // Auto-discover content slugs from markdown frontmatter
  if (config.contentDirs) {
    for (const [name, dir] of Object.entries(config.contentDirs)) {
      slugMaps[name] = loadSlugMapSync(join(process.cwd(), dir));
    }
  }

  // Build the route-injection integration
  const routeIntegration = createI18nIntegration({ config, pages });

  // Serialize config data for the virtual module (strip non-serializable fields)
  const serializedConfig = JSON.stringify({
    translations: config.translations,
    defaultLocale: config.defaultLocale,
    locales: config.locales,
    localeLabels: config.localeLabels,
    localeHtmlLang: config.localeHtmlLang,
    i18nextOptions: config.i18next?.options,
  });
  const serializedSlugMaps = JSON.stringify(slugMaps);

  return {
    name: '@otrodigital/astro-i18n-next',
    hooks: {
      'astro:config:setup': (hookOptions) => {
        // Delegate route injection and Astro i18n config
        const routeSetup = routeIntegration.hooks['astro:config:setup'];
        if (typeof routeSetup === 'function') {
          (routeSetup as Function)(hookOptions);
        }

        // Add Vite plugin to serve virtual:i18n
        hookOptions.updateConfig({
          vite: {
            plugins: [{
              name: 'i18n-virtual-module',
              resolveId(id: string) {
                if (id === 'virtual:i18n') return '\0virtual:i18n';
              },
              load(id: string) {
                if (id !== '\0virtual:i18n') return;

                return `
import { createTranslator } from '@otrodigital/astro-i18n-next';
import { createSlugResolver } from '@otrodigital/astro-i18n-next';
import { createRouteHelpers } from '@otrodigital/astro-i18n-next';
import { createContentHelper } from '@otrodigital/astro-i18n-next';

const _cfg = ${serializedConfig};
const _slugMaps = ${serializedSlugMaps};

export const t = createTranslator(_cfg.translations, _cfg.defaultLocale, { options: _cfg.i18nextOptions });
const _slugs = createSlugResolver(_slugMaps, _cfg.defaultLocale);
export const getLocalizedSlug = _slugs.getLocalizedSlug;
export const getCanonicalSlug = _slugs.getCanonicalSlug;
const _routes = createRouteHelpers(_cfg.defaultLocale, _cfg.locales, _slugMaps);
export const localePath = _routes.localePath;
export const switchLocalePath = _routes.switchLocalePath;
export const getLocaleFromPath = _routes.getLocaleFromPath;
export const localized = createContentHelper(_cfg.defaultLocale);
export const config = { defaultLocale: _cfg.defaultLocale, locales: _cfg.locales, localeLabels: _cfg.localeLabels, localeHtmlLang: _cfg.localeHtmlLang };
export const { defaultLocale, locales, localeLabels, localeHtmlLang } = config;
`;
              },
            }],
          },
        });
      },
    },
  };
}
