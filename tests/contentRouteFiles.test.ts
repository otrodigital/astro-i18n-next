import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { writeContentRouteFiles } from '../src/contentRouteFiles';
import type { ContentRouteConfig, SlugMap } from '../src/types';

const CACHE_DIR = join(process.cwd(), 'node_modules/.astro-i18n-cache');

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

function createFiles() {
  return writeContentRouteFiles({
    contentRoutes,
    slugMaps,
    locales: ['en', 'es'],
    defaultLocale: 'en',
  });
}

afterEach(() => {
  // Clean up generated files
  if (existsSync(CACHE_DIR)) {
    rmSync(CACHE_DIR, { recursive: true });
  }
});

describe('writeContentRouteFiles', () => {
  it('returns entrypoints for each locale x route combination', () => {
    const entrypoints = createFiles();

    expect(entrypoints['case-studies/en']).toBeDefined();
    expect(entrypoints['case-studies/es']).toBeDefined();
  });

  it('writes real .astro files to disk', () => {
    const entrypoints = createFiles();

    expect(existsSync(entrypoints['case-studies/en'])).toBe(true);
    expect(existsSync(entrypoints['case-studies/es'])).toBe(true);
  });

  it('EN file contains only EN slugs in getStaticPaths', () => {
    const entrypoints = createFiles();
    const content = readFileSync(entrypoints['case-studies/en'], 'utf-8');

    expect(content).toContain("slug: 'annex-ai-platform'");
    expect(content).toContain("slug: 'industrial-sauna'");
    // Should NOT contain ES slugs
    expect(content).not.toContain("slug: 'annex-plataforma-ia-construccion'");
    expect(content).not.toContain("slug: 'reforma-sauna-industrial'");
  });

  it('ES file contains only ES slugs in getStaticPaths', () => {
    const entrypoints = createFiles();
    const content = readFileSync(entrypoints['case-studies/es'], 'utf-8');

    expect(content).toContain("slug: 'annex-plataforma-ia-construccion'");
    expect(content).toContain("slug: 'reforma-sauna-industrial'");
    // Should NOT contain EN slugs
    expect(content).not.toContain("slug: 'annex-ai-platform'");
    expect(content).not.toContain("slug: 'industrial-sauna'");
  });

  it('includes canonicalSlug in props', () => {
    const entrypoints = createFiles();
    const content = readFileSync(entrypoints['case-studies/es'], 'utf-8');

    expect(content).toContain("canonicalSlug: 'annex-ai-platform'");
    expect(content).toContain("canonicalSlug: 'industrial-sauna'");
  });

  it('imports template and renders via <Template />', () => {
    const entrypoints = createFiles();
    const content = readFileSync(entrypoints['case-studies/en'], 'utf-8');

    expect(content).toContain("import Template from");
    expect(content).toContain("_[...slug].astro");
    expect(content).toContain("<Template {...props} />");
  });

  it('returns empty paths when slug map is missing', () => {
    const entrypoints = writeContentRouteFiles({
      contentRoutes: {
        blog: {
          template: 'src/pages/blog/_[...slug].astro',
          contentDir: 'src/content/blog',
          prefixes: { en: 'blog', es: 'blog' },
        },
      },
      slugMaps: {},
      locales: ['en', 'es'],
      defaultLocale: 'en',
    });

    const content = readFileSync(entrypoints['blog/en'], 'utf-8');
    expect(content).toContain('return [];');
  });
});
