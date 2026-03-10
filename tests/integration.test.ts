import { describe, it, expect, vi } from 'vitest';
import { createI18nIntegration } from '../src/integration';
import type { ContentRouteConfig, LocaleConfig, PageEntry } from '../src/types';

const config: LocaleConfig = {
  defaultLocale: 'en',
  locales: ['en', 'es'],
  localeLabels: { en: 'English', es: 'Espanol' },
  localeHtmlLang: { en: 'en', es: 'es' },
};

const pages: Record<string, PageEntry> = {
  index: { entrypoint: 'src/pages/index.astro', slugs: { en: '', es: '' } },
  about: { entrypoint: 'src/pages/about.astro', slugs: { en: 'about', es: 'sobre' } },
};

function runSetup(options: Parameters<typeof createI18nIntegration>[0]) {
  const integration = createI18nIntegration(options);
  const injectRoute = vi.fn();
  const updateConfig = vi.fn();

  const hook = integration.hooks['astro:config:setup'];
  if (typeof hook === 'function') {
    (hook as Function)({ injectRoute, updateConfig });
  }

  return { injectRoute, updateConfig };
}

describe('createI18nIntegration', () => {
  describe('static page routes', () => {
    it('injects routes for non-default locales only', () => {
      const { injectRoute } = runSetup({ config, pages });

      // Should inject ES routes for index and about
      expect(injectRoute).toHaveBeenCalledWith({
        pattern: '/es',
        entrypoint: 'src/pages/index.astro',
        prerender: true,
      });
      expect(injectRoute).toHaveBeenCalledWith({
        pattern: '/es/sobre',
        entrypoint: 'src/pages/about.astro',
        prerender: true,
      });

      // Should NOT inject EN routes (handled by filesystem)
      const calls = injectRoute.mock.calls.map((c: any[]) => c[0].pattern);
      expect(calls.every((p: string) => p.startsWith('/es'))).toBe(true);
    });
  });

  describe('content routes', () => {
    const contentRoutes: Record<string, ContentRouteConfig> = {
      'case-studies': {
        template: 'src/pages/case-studies/_[...slug].astro',
        contentDir: 'src/content/case-studies',
        prefixes: { en: 'case-studies', es: 'estudios-de-caso' },
      },
    };

    it('injects content routes for ALL locales including default', () => {
      const { injectRoute } = runSetup({ config, pages, contentRoutes });

      expect(injectRoute).toHaveBeenCalledWith({
        pattern: '/case-studies/[...slug]',
        entrypoint: 'virtual:content-route/case-studies/en',
        prerender: true,
      });
      expect(injectRoute).toHaveBeenCalledWith({
        pattern: '/es/estudios-de-caso/[...slug]',
        entrypoint: 'virtual:content-route/case-studies/es',
        prerender: true,
      });
    });

    it('default locale route has no locale prefix', () => {
      const { injectRoute } = runSetup({ config, pages, contentRoutes });

      const contentCalls = injectRoute.mock.calls
        .map((c: any[]) => c[0])
        .filter((r: any) => r.entrypoint.startsWith('virtual:content-route/'));

      const enRoute = contentCalls.find((r: any) => r.entrypoint.includes('/en'));
      expect(enRoute.pattern).toBe('/case-studies/[...slug]');
      expect(enRoute.pattern).not.toContain('/en/');
    });

    it('non-default locale route has locale prefix', () => {
      const { injectRoute } = runSetup({ config, pages, contentRoutes });

      const contentCalls = injectRoute.mock.calls
        .map((c: any[]) => c[0])
        .filter((r: any) => r.entrypoint.startsWith('virtual:content-route/'));

      const esRoute = contentCalls.find((r: any) => r.entrypoint.includes('/es'));
      expect(esRoute.pattern).toBe('/es/estudios-de-caso/[...slug]');
    });

    it('entrypoints use virtual module IDs', () => {
      const { injectRoute } = runSetup({ config, pages, contentRoutes });

      const contentCalls = injectRoute.mock.calls
        .map((c: any[]) => c[0])
        .filter((r: any) => r.entrypoint.startsWith('virtual:content-route/'));

      expect(contentCalls).toHaveLength(2);
      contentCalls.forEach((r: any) => {
        expect(r.entrypoint).toMatch(/^virtual:content-route\/case-studies\/(en|es)$/);
      });
    });

    it('uses routeKey as fallback prefix when locale not in prefixes', () => {
      const routesWithMissingPrefix: Record<string, ContentRouteConfig> = {
        blog: {
          template: 'src/pages/blog/_[...slug].astro',
          contentDir: 'src/content/blog',
          prefixes: { en: 'blog' }, // no 'es' prefix
        },
      };

      const { injectRoute } = runSetup({ config, pages, contentRoutes: routesWithMissingPrefix });

      // ES should fall back to routeKey 'blog'
      expect(injectRoute).toHaveBeenCalledWith({
        pattern: '/es/blog/[...slug]',
        entrypoint: 'virtual:content-route/blog/es',
        prerender: true,
      });
    });
  });
});
