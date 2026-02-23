import { describe, it, expect } from 'vitest';
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

const { localePath, switchLocalePath, getLocaleFromPath } = createRouteHelpers('en', ['en', 'es'], slugMaps);

describe('getLocaleFromPath', () => {
  it('detects non-default locale from prefix', () => {
    expect(getLocaleFromPath('/es/sobre/')).toBe('es');
  });

  it('returns default locale for unprefixed paths', () => {
    expect(getLocaleFromPath('/about/')).toBe('en');
  });

  it('returns default locale for root path', () => {
    expect(getLocaleFromPath('/')).toBe('en');
  });
});

describe('localePath', () => {
  it('returns path unchanged for default locale', () => {
    expect(localePath('en', '/about/')).toBe('/about/');
    expect(localePath('en', '/')).toBe('/');
  });

  it('adds locale prefix for non-default locale', () => {
    expect(localePath('es', '/')).toBe('/es/');
  });

  it('translates page slugs for non-default locale', () => {
    expect(localePath('es', '/about/')).toBe('/es/sobre/');
    expect(localePath('es', '/contact/')).toBe('/es/contacto/');
  });

  it('translates content slugs within path', () => {
    expect(localePath('es', '/saunas/model-165/')).toBe('/es/saunas/modelo-165/');
  });
});

describe('switchLocalePath', () => {
  it('switches from non-default to default locale', () => {
    expect(switchLocalePath('/es/sobre/', 'en')).toBe('/about/');
  });

  it('switches from default to non-default locale', () => {
    expect(switchLocalePath('/about/', 'es')).toBe('/es/sobre/');
  });

  it('handles content slug translation', () => {
    expect(switchLocalePath('/es/saunas/modelo-165/', 'en')).toBe('/saunas/model-165/');
  });
});
