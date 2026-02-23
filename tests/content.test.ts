import { describe, it, expect } from 'vitest';
import { createContentHelper } from '../src/content';

describe('createContentHelper', () => {
  const localized = createContentHelper('en');

  it('returns the value for the requested locale', () => {
    expect(localized({ en: 'Hello', es: 'Hola' }, 'es')).toBe('Hola');
  });

  it('returns the default locale value when target is missing', () => {
    expect(localized({ en: 'Hello' }, 'es')).toBe('Hello');
  });

  it('returns the default locale value for the default locale', () => {
    expect(localized({ en: 'Hello', es: 'Hola' }, 'en')).toBe('Hello');
  });

  it('works with array values', () => {
    const field = { en: ['a', 'b'], es: ['x', 'y'] };
    expect(localized(field, 'es')).toEqual(['x', 'y']);
  });

  it('works with object values', () => {
    const field = { en: { title: 'Hi' }, es: { title: 'Hola' } };
    expect(localized(field, 'es')).toEqual({ title: 'Hola' });
  });
});
