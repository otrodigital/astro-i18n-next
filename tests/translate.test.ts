import { describe, it, expect } from 'vitest';
import { createTranslator } from '../src/translate';

const translations = {
  en: {
    greeting: 'Hello',
    nav: { about: 'About', contact: 'Contact' },
  },
  es: {
    greeting: 'Hola',
    nav: { about: 'Acerca de' },
  },
};

describe('createTranslator', () => {
  const t = createTranslator(translations, 'en');

  it('returns the correct translation for a locale', () => {
    expect(t('en', 'greeting')).toBe('Hello');
    expect(t('es', 'greeting')).toBe('Hola');
  });

  it('supports dot-notation keys', () => {
    expect(t('en', 'nav.about')).toBe('About');
    expect(t('es', 'nav.about')).toBe('Acerca de');
  });

  it('falls back to default locale for missing keys', () => {
    expect(t('es', 'nav.contact')).toBe('Contact');
  });

  it('returns the key when not found in any locale', () => {
    expect(t('en', 'nonexistent')).toBe('nonexistent');
  });
});
