import type { SlugMap } from './types.js';

/**
 * Creates route helper functions for locale-aware path generation.
 */
export function createRouteHelpers(
  defaultLocale: string,
  locales: string[],
  slugMaps: Record<string, SlugMap>,
) {
  // Pre-sort entries by key length descending so composed paths
  // (e.g. 'services/consulting') are matched before their parents ('services')
  const sortedSlugMaps: Record<string, [string, Record<string, string>][]> =
    Object.fromEntries(
      Object.entries(slugMaps).map(([name, map]) => [
        name,
        Object.entries(map).sort(([a], [b]) => b.length - a.length),
      ]),
    );

  /**
   * Get locale from a URL pathname.
   * '/es/sobre/' → 'es', '/about/' → defaultLocale
   */
  function getLocaleFromPath(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean);
    const first = segments[0];
    if (first && locales.includes(first) && first !== defaultLocale) {
      return first;
    }
    return defaultLocale;
  }

  /**
   * Build a localized path from locale + canonical English path.
   * localePath('en', '/about/') → '/about/'
   * localePath('es', '/about/') → '/es/sobre/'
   * localePath('es', '/saunas/model-165/') → '/es/saunas/modelo-165/'
   */
  function localePath(locale: string, path: string): string {
    let result = path;

    // Translate slug segments from all slug maps (pages, content collections, etc.)
    for (const [, entries] of Object.entries(sortedSlugMaps)) {
      for (const [canonical, localeMap] of entries) {
        const translated = localeMap[locale] ?? canonical;
        if (translated !== canonical && canonical !== '') {
          const before = result;
          result = result.replace(`/${canonical}/`, `/${translated}/`);
          // Only try end-of-string match if the trailing-slash version didn't match
          if (result === before) {
            result = result.replace(new RegExp(`/${canonical}$`), `/${translated}`);
          }
        }
      }
    }

    if (locale === defaultLocale) return result;

    const cleanPath = result.startsWith('/') ? result : `/${result}`;
    return `/${locale}${cleanPath}`;
  }

  /**
   * Get the equivalent path for switching locale.
   * switchLocalePath('/es/saunas/modelo-165/', 'en') → '/saunas/model-165/'
   * switchLocalePath('/about/', 'es') → '/es/sobre/'
   */
  function switchLocalePath(currentPath: string, targetLocale: string): string {
    const currentLocale = getLocaleFromPath(currentPath);

    // Strip current locale prefix
    let basePath = currentPath;
    if (currentLocale !== defaultLocale) {
      basePath = currentPath.replace(new RegExp(`^/${currentLocale}`), '') || '/';
    }

    // Reverse-translate all slug segments back to canonical (English)
    let canonicalPath = basePath;

    if (currentLocale !== defaultLocale) {
      // Reverse-translate all slug maps back to canonical
      for (const [, entries] of Object.entries(sortedSlugMaps)) {
        for (const [canonical, localeMap] of entries) {
          const translated = localeMap[currentLocale];
          if (translated && translated !== canonical) {
            const before = canonicalPath;
            canonicalPath = canonicalPath.replace(`/${translated}/`, `/${canonical}/`);
            if (canonicalPath === before) {
              canonicalPath = canonicalPath.replace(new RegExp(`/${translated}$`), `/${canonical}`);
            }
          }
        }
      }
    }

    // Now forward-translate to target locale
    return localePath(targetLocale, canonicalPath);
  }

  return { localePath, switchLocalePath, getLocaleFromPath };
}
