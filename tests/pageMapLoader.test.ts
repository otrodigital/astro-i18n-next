import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadPageMapSync } from '../src/pageMapLoader';

const fixturesDir = join(import.meta.dirname, '__fixtures__', 'pages');

describe('loadPageMapSync', () => {
  // Override process.cwd so the relative path resolves to our fixtures
  const originalCwd = process.cwd;

  it('discovers .astro files and builds page map', () => {
    // loadPageMapSync joins process.cwd() + pagesDir, so we mock cwd
    process.cwd = () => join(import.meta.dirname, '__fixtures__');
    try {
      const { pages, pageSlugMap } = loadPageMapSync('pages', ['en', 'es']);

      expect(Object.keys(pages)).toContain('index');
      expect(Object.keys(pages)).toContain('about');
      expect(Object.keys(pages)).toContain('saunas');
    } finally {
      process.cwd = originalCwd;
    }
  });

  it('extracts explicit slugs from frontmatter', () => {
    process.cwd = () => join(import.meta.dirname, '__fixtures__');
    try {
      const { pages } = loadPageMapSync('pages', ['en', 'es']);

      expect(pages.about.slugs).toEqual({ en: 'about', es: 'sobre' });
    } finally {
      process.cwd = originalCwd;
    }
  });

  it('defaults to filename slug when no export', () => {
    process.cwd = () => join(import.meta.dirname, '__fixtures__');
    try {
      const { pages } = loadPageMapSync('pages', ['en', 'es']);

      // saunas/index.astro → key 'saunas', slug 'saunas' for all locales
      expect(pages.saunas.slugs).toEqual({ en: 'saunas', es: 'saunas' });
    } finally {
      process.cwd = originalCwd;
    }
  });

  it('uses empty slug for index page', () => {
    process.cwd = () => join(import.meta.dirname, '__fixtures__');
    try {
      const { pages } = loadPageMapSync('pages', ['en', 'es']);

      expect(pages.index.slugs).toEqual({ en: '', es: '' });
    } finally {
      process.cwd = originalCwd;
    }
  });

  it('returns a pageSlugMap matching the pages', () => {
    process.cwd = () => join(import.meta.dirname, '__fixtures__');
    try {
      const { pages, pageSlugMap } = loadPageMapSync('pages', ['en', 'es']);

      expect(pageSlugMap.about).toEqual(pages.about.slugs);
      expect(pageSlugMap.index).toEqual(pages.index.slugs);
    } finally {
      process.cwd = originalCwd;
    }
  });

  it('sets correct entrypoints', () => {
    process.cwd = () => join(import.meta.dirname, '__fixtures__');
    try {
      const { pages } = loadPageMapSync('pages', ['en', 'es']);

      expect(pages.index.entrypoint).toBe('pages/index.astro');
      expect(pages.about.entrypoint).toBe('pages/about.astro');
      expect(pages.saunas.entrypoint).toBe('pages/saunas/index.astro');
    } finally {
      process.cwd = originalCwd;
    }
  });
});
