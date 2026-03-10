import { describe, it, expect } from 'vitest';
import { createContentRoutePlugin } from '../src/contentRouteVite';
import type { ContentRouteConfig, SlugMap } from '../src/types';

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
    'industrial-sauna': { en: 'industrial-sauna', es: 'reforma-sauna-industrial' },
  },
};

function createPlugin() {
  return createContentRoutePlugin({
    contentRoutes,
    slugMaps,
    locales: ['en', 'es'],
    defaultLocale: 'en',
  });
}

describe('createContentRoutePlugin', () => {
  describe('resolveId', () => {
    it('resolves virtual:content-route/ IDs', () => {
      const plugin = createPlugin();
      const result = plugin.resolveId('virtual:content-route/case-studies/en');
      expect(result).toBe('\0virtual:content-route/case-studies/en');
    });

    it('returns undefined for non-matching IDs', () => {
      const plugin = createPlugin();
      expect(plugin.resolveId('virtual:i18n')).toBeUndefined();
      expect(plugin.resolveId('some-other-module')).toBeUndefined();
    });
  });

  describe('load', () => {
    it('returns undefined for non-matching IDs', () => {
      const plugin = createPlugin();
      expect(plugin.load('\0virtual:i18n')).toBeUndefined();
      expect(plugin.load('random-id')).toBeUndefined();
    });

    it('returns undefined for unknown route keys', () => {
      const plugin = createPlugin();
      expect(plugin.load('\0virtual:content-route/unknown/en')).toBeUndefined();
    });

    it('generates module with EN-only slugs for EN locale', () => {
      const plugin = createPlugin();
      const result = plugin.load('\0virtual:content-route/case-studies/en') as string;

      expect(result).toContain("export { default } from '/src/pages/case-studies/_[...slug].astro'");
      expect(result).toContain("slug: 'annex-ai-platform'");
      expect(result).toContain("slug: 'industrial-sauna'");
      // Should NOT contain ES slugs as params
      expect(result).not.toContain("slug: 'annex-plataforma-ia-construccion'");
      expect(result).not.toContain("slug: 'reforma-sauna-industrial'");
    });

    it('generates module with ES-only slugs for ES locale', () => {
      const plugin = createPlugin();
      const result = plugin.load('\0virtual:content-route/case-studies/es') as string;

      expect(result).toContain("export { default } from '/src/pages/case-studies/_[...slug].astro'");
      expect(result).toContain("slug: 'annex-plataforma-ia-construccion'");
      expect(result).toContain("slug: 'reforma-sauna-industrial'");
      // Should NOT contain EN slugs as params
      expect(result).not.toContain("slug: 'annex-ai-platform'");
      expect(result).not.toContain("slug: 'industrial-sauna'");
    });

    it('includes canonicalSlug in props', () => {
      const plugin = createPlugin();
      const result = plugin.load('\0virtual:content-route/case-studies/es') as string;

      expect(result).toContain("canonicalSlug: 'annex-ai-platform'");
      expect(result).toContain("canonicalSlug: 'industrial-sauna'");
    });

    it('exports getStaticPaths function', () => {
      const plugin = createPlugin();
      const result = plugin.load('\0virtual:content-route/case-studies/en') as string;

      expect(result).toContain('export function getStaticPaths()');
    });

    it('returns empty paths when slug map is missing for route key', () => {
      const plugin = createContentRoutePlugin({
        contentRoutes: {
          blog: {
            template: 'src/pages/blog/_[...slug].astro',
            contentDir: 'src/content/blog',
            prefixes: { en: 'blog', es: 'blog' },
          },
        },
        slugMaps: {}, // no slug map for 'blog'
        locales: ['en', 'es'],
        defaultLocale: 'en',
      });

      const result = plugin.load('\0virtual:content-route/blog/en') as string;
      expect(result).toContain('export function getStaticPaths() { return []; }');
    });
  });
});
