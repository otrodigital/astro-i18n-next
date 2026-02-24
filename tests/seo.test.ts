import { describe, it, expect } from 'vitest';
import { generateHrefLangs, generateCanonicalURL, generateOGLocales, toOGLocale } from '../src/seo';
import { createRouteHelpers } from '../src/routes';

const slugMaps = {
  pages: {
    index: { en: '', es: '' },
    about: { en: 'about', es: 'sobre' },
    contact: { en: 'contact', es: 'contacto' },
    saunas: { en: 'saunas', es: 'saunas' },
  },
  saunas: {
    'model-165': { en: 'model-165', es: 'modelo-165' },
  },
};

const locales = ['en', 'es'];
const defaultLocale = 'en';
const localeHtmlLang: Record<string, string> = { en: 'en', es: 'es' };

const { switchLocalePath, getLocaleFromPath } = createRouteHelpers(defaultLocale, locales, slugMaps);

describe('generateHrefLangs', () => {
  it('generates entries for all locales plus x-default', () => {
    const entries = generateHrefLangs('/about/', 'https://example.com', locales, defaultLocale, localeHtmlLang, switchLocalePath);

    expect(entries).toHaveLength(3); // en, es, x-default
    expect(entries[0]).toEqual({ hreflang: 'en', href: 'https://example.com/about/' });
    expect(entries[1]).toEqual({ hreflang: 'es', href: 'https://example.com/es/sobre/' });
    expect(entries[2]).toEqual({ hreflang: 'x-default', href: 'https://example.com/about/' });
  });

  it('works from a non-default locale path', () => {
    const entries = generateHrefLangs('/es/sobre/', 'https://example.com', locales, defaultLocale, localeHtmlLang, switchLocalePath);

    expect(entries[0]).toEqual({ hreflang: 'en', href: 'https://example.com/about/' });
    expect(entries[1]).toEqual({ hreflang: 'es', href: 'https://example.com/es/sobre/' });
    expect(entries[2]).toEqual({ hreflang: 'x-default', href: 'https://example.com/about/' });
  });

  it('handles the root path', () => {
    const entries = generateHrefLangs('/', 'https://example.com', locales, defaultLocale, localeHtmlLang, switchLocalePath);

    expect(entries[0]).toEqual({ hreflang: 'en', href: 'https://example.com/' });
    expect(entries[1]).toEqual({ hreflang: 'es', href: 'https://example.com/es/' });
    expect(entries[2]).toEqual({ hreflang: 'x-default', href: 'https://example.com/' });
  });

  it('strips trailing slash from siteUrl', () => {
    const entries = generateHrefLangs('/about/', 'https://example.com/', locales, defaultLocale, localeHtmlLang, switchLocalePath);

    expect(entries[0].href).toBe('https://example.com/about/');
  });

  it('handles content slug translation', () => {
    const entries = generateHrefLangs('/saunas/model-165/', 'https://example.com', locales, defaultLocale, localeHtmlLang, switchLocalePath);

    expect(entries[0]).toEqual({ hreflang: 'en', href: 'https://example.com/saunas/model-165/' });
    expect(entries[1]).toEqual({ hreflang: 'es', href: 'https://example.com/es/saunas/modelo-165/' });
  });
});

describe('generateCanonicalURL', () => {
  it('generates the correct canonical URL', () => {
    expect(generateCanonicalURL('/about/', 'https://example.com')).toBe('https://example.com/about/');
  });

  it('strips trailing slash from siteUrl', () => {
    expect(generateCanonicalURL('/about/', 'https://example.com/')).toBe('https://example.com/about/');
  });

  it('handles root path', () => {
    expect(generateCanonicalURL('/', 'https://example.com')).toBe('https://example.com/');
  });
});

describe('toOGLocale', () => {
  it('converts simple lang codes', () => {
    expect(toOGLocale('en')).toBe('en_US');
    expect(toOGLocale('es')).toBe('es_ES');
    expect(toOGLocale('fr')).toBe('fr_FR');
    expect(toOGLocale('pt')).toBe('pt_PT');
  });

  it('converts hyphenated lang codes', () => {
    expect(toOGLocale('en-GB')).toBe('en_GB');
    expect(toOGLocale('pt-BR')).toBe('pt_BR');
    expect(toOGLocale('zh-CN')).toBe('zh_CN');
  });
});

describe('generateOGLocales', () => {
  it('returns current and alternate locales', () => {
    const result = generateOGLocales('/about/', locales, defaultLocale, localeHtmlLang, getLocaleFromPath);

    expect(result.current).toBe('en_US');
    expect(result.alternates).toEqual(['es_ES']);
  });

  it('detects non-default locale as current', () => {
    const result = generateOGLocales('/es/sobre/', locales, defaultLocale, localeHtmlLang, getLocaleFromPath);

    expect(result.current).toBe('es_ES');
    expect(result.alternates).toEqual(['en_US']);
  });

  it('handles root path', () => {
    const result = generateOGLocales('/', locales, defaultLocale, localeHtmlLang, getLocaleFromPath);

    expect(result.current).toBe('en_US');
    expect(result.alternates).toEqual(['es_ES']);
  });
});
