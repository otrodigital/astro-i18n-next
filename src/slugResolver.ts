import type { SlugMap } from './types';

/**
 * Creates slug resolution functions for a set of named slug maps.
 * Each slug map category (e.g. 'pages', 'saunas') maps canonical slugs
 * to locale-specific slugs.
 */
export function createSlugResolver(
  slugMaps: Record<string, SlugMap>,
  defaultLocale: string,
) {
  function getLocalizedSlug(category: string, canonicalSlug: string, locale: string): string {
    return slugMaps[category]?.[canonicalSlug]?.[locale] ?? canonicalSlug;
  }

  function getCanonicalSlug(category: string, localizedSlug: string, locale: string): string | undefined {
    if (locale === defaultLocale) return localizedSlug;
    const map = slugMaps[category];
    if (!map) return undefined;
    for (const [canonical, locales] of Object.entries(map)) {
      if (locales[locale] === localizedSlug) return canonical;
    }
    return undefined;
  }

  function getAllSlugPairs(category: string, locale: string): { canonical: string; localized: string }[] {
    const map = slugMaps[category];
    if (!map) return [];
    return Object.entries(map).map(([canonical, locales]) => ({
      canonical,
      localized: locales[locale] ?? canonical,
    }));
  }

  return { getLocalizedSlug, getCanonicalSlug, getAllSlugPairs };
}
