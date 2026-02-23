import type { SlugMap } from './types';

/**
 * Creates route helper functions for locale-aware path generation.
 */
export function createRouteHelpers(
  defaultLocale: string,
  locales: string[],
  slugMaps: Record<string, SlugMap>,
) {
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

    // Translate page slug segments
    const pageMap = slugMaps.pages;
    if (pageMap) {
      for (const [canonical, localeMap] of Object.entries(pageMap)) {
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

    // Translate sauna slugs within path
    const saunaMap = slugMaps.saunas;
    if (saunaMap) {
      for (const [canonical, localeMap] of Object.entries(saunaMap)) {
        const translated = localeMap[locale] ?? canonical;
        if (translated !== canonical) {
          const before = result;
          result = result.replace(`/${canonical}/`, `/${translated}/`);
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
      // Reverse page slugs
      const pageMap = slugMaps.pages;
      if (pageMap) {
        for (const [canonical, localeMap] of Object.entries(pageMap)) {
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

      // Reverse sauna slugs
      const saunaMap = slugMaps.saunas;
      if (saunaMap) {
        for (const [canonical, localeMap] of Object.entries(saunaMap)) {
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
