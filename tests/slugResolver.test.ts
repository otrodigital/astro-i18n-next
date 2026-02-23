import { describe, it, expect } from 'vitest';
import { createSlugResolver } from '../src/slugResolver';

const slugMaps = {
  pages: {
    about: { en: 'about', es: 'sobre' },
    contact: { en: 'contact', es: 'contacto' },
  },
  saunas: {
    'model-165': { en: 'model-165', es: 'modelo-165' },
    'model-250': { en: 'model-250', es: 'modelo-250' },
  },
};

describe('createSlugResolver', () => {
  const { getLocalizedSlug, getCanonicalSlug, getAllSlugPairs } = createSlugResolver(slugMaps, 'en');

  describe('getLocalizedSlug', () => {
    it('returns the localized slug', () => {
      expect(getLocalizedSlug('pages', 'about', 'es')).toBe('sobre');
      expect(getLocalizedSlug('saunas', 'model-165', 'es')).toBe('modelo-165');
    });

    it('returns the canonical slug for the default locale', () => {
      expect(getLocalizedSlug('pages', 'about', 'en')).toBe('about');
    });

    it('returns the canonical slug for unknown categories', () => {
      expect(getLocalizedSlug('unknown', 'about', 'es')).toBe('about');
    });

    it('returns the canonical slug for unknown slugs', () => {
      expect(getLocalizedSlug('pages', 'unknown', 'es')).toBe('unknown');
    });
  });

  describe('getCanonicalSlug', () => {
    it('returns the canonical slug from a localized one', () => {
      expect(getCanonicalSlug('pages', 'sobre', 'es')).toBe('about');
      expect(getCanonicalSlug('saunas', 'modelo-165', 'es')).toBe('model-165');
    });

    it('returns the slug itself for default locale', () => {
      expect(getCanonicalSlug('pages', 'about', 'en')).toBe('about');
    });

    it('returns undefined for unknown localized slugs', () => {
      expect(getCanonicalSlug('pages', 'unknown', 'es')).toBeUndefined();
    });

    it('returns undefined for unknown categories', () => {
      expect(getCanonicalSlug('unknown', 'sobre', 'es')).toBeUndefined();
    });
  });

  describe('getAllSlugPairs', () => {
    it('returns all pairs for a category and locale', () => {
      const pairs = getAllSlugPairs('pages', 'es');
      expect(pairs).toEqual([
        { canonical: 'about', localized: 'sobre' },
        { canonical: 'contact', localized: 'contacto' },
      ]);
    });

    it('returns empty array for unknown category', () => {
      expect(getAllSlugPairs('unknown', 'es')).toEqual([]);
    });
  });
});
