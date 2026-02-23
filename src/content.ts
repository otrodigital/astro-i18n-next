/**
 * Extract a localized value from a { en: string, es?: string } object.
 * Falls back to the default locale value if the target is missing.
 */
export function createContentHelper(defaultLocale: string) {
  return function localized<T>(field: Record<string, T>, locale: string): T {
    return field[locale] ?? field[defaultLocale];
  };
}
