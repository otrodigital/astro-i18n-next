import { describe, it, expect, vi, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createI18nIntegration } from '../src/integration';
import type { ContentRouteConfig, LocaleConfig, PageEntry, SlugMap } from '../src/types';

const CACHE_DIR = join(process.cwd(), 'node_modules/.astro-i18n-cache');

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

afterEach(() => {
  if (existsSync(CACHE_DIR)) {
    rmSync(CACHE_DIR, { recursive: true });
  }
});

describe('createI18nIntegration', () => {
  describe('static page routes', () => {
    it('injects routes for non-default locales only', () => {
      const { injectRoute } = runSetup({ config, pages });

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

    const slugMaps: Record<string, SlugMap> = {
      'case-studies': {
        'annex-ai-platform': { en: 'annex-ai-platform', es: 'annex-plataforma-ia-construccion' },
      },
    };

    it('injects content routes for ALL locales including default', () => {
      const { injectRoute } = runSetup({ config, pages, contentRoutes, slugMaps });

      const contentCalls = injectRoute.mock.calls
        .map((c: any[]) => c[0])
        .filter((r: any) => r.pattern.includes('[...slug]'));

      expect(contentCalls).toHaveLength(2);

      const patterns = contentCalls.map((r: any) => r.pattern);
      expect(patterns).toContain('/case-studies/[...slug]');
      expect(patterns).toContain('/es/estudios-de-caso/[...slug]');
    });

    it('default locale route has no locale prefix', () => {
      const { injectRoute } = runSetup({ config, pages, contentRoutes, slugMaps });

      const contentCalls = injectRoute.mock.calls
        .map((c: any[]) => c[0])
        .filter((r: any) => r.pattern.includes('[...slug]'));

      const enRoute = contentCalls.find((r: any) => r.pattern === '/case-studies/[...slug]');
      expect(enRoute).toBeDefined();
      expect(enRoute.pattern).not.toContain('/en/');
    });

    it('non-default locale route has locale prefix', () => {
      const { injectRoute } = runSetup({ config, pages, contentRoutes, slugMaps });

      const contentCalls = injectRoute.mock.calls
        .map((c: any[]) => c[0])
        .filter((r: any) => r.pattern.includes('[...slug]'));

      const esRoute = contentCalls.find((r: any) => r.pattern.includes('/es/'));
      expect(esRoute).toBeDefined();
      expect(esRoute.pattern).toBe('/es/estudios-de-caso/[...slug]');
    });

    it('entrypoints are real file paths', () => {
      const { injectRoute } = runSetup({ config, pages, contentRoutes, slugMaps });

      const contentCalls = injectRoute.mock.calls
        .map((c: any[]) => c[0])
        .filter((r: any) => r.pattern.includes('[...slug]'));

      contentCalls.forEach((r: any) => {
        expect(r.entrypoint).toContain('.astro-i18n-cache');
        expect(r.entrypoint).toMatch(/\.(astro)$/);
        expect(existsSync(r.entrypoint)).toBe(true);
      });
    });

    it('uses routeKey as fallback prefix when locale not in prefixes', () => {
      const routesWithMissingPrefix: Record<string, ContentRouteConfig> = {
        blog: {
          template: 'src/pages/blog/_[...slug].astro',
          contentDir: 'src/content/blog',
          prefixes: { en: 'blog' },
        },
      };

      const blogSlugMaps: Record<string, SlugMap> = {
        blog: { 'post-1': { en: 'post-1', es: 'post-1' } },
      };

      const { injectRoute } = runSetup({
        config,
        pages,
        contentRoutes: routesWithMissingPrefix,
        slugMaps: blogSlugMaps,
      });

      const contentCalls = injectRoute.mock.calls
        .map((c: any[]) => c[0])
        .filter((r: any) => r.pattern.includes('[...slug]'));

      const esRoute = contentCalls.find((r: any) => r.pattern.includes('/es/'));
      expect(esRoute.pattern).toBe('/es/blog/[...slug]');
    });
  });
});
