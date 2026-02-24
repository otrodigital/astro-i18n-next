/**
 * Pure functions for generating SEO-related HTML tags for multilingual sites.
 * Used by the Astro components (HrefLangs, CanonicalURL, OpenGraphLocale).
 */

export interface HrefLangEntry {
  hreflang: string;
  href: string;
}

export interface OGLocaleResult {
  current: string;
  alternates: string[];
}

/**
 * Generates hreflang alternate link entries for all locales, plus x-default.
 */
export function generateHrefLangs(
  currentPath: string,
  siteUrl: string,
  locales: string[],
  defaultLocale: string,
  localeHtmlLang: Record<string, string>,
  switchLocalePath: (currentPath: string, targetLocale: string) => string,
): HrefLangEntry[] {
  const base = siteUrl.replace(/\/$/, '');
  const entries: HrefLangEntry[] = [];

  for (const locale of locales) {
    const path = switchLocalePath(currentPath, locale);
    entries.push({
      hreflang: localeHtmlLang[locale] ?? locale,
      href: `${base}${path}`,
    });
  }

  // x-default points to the default locale version
  const defaultPath = switchLocalePath(currentPath, defaultLocale);
  entries.push({
    hreflang: 'x-default',
    href: `${base}${defaultPath}`,
  });

  return entries;
}

/**
 * Generates the canonical URL for the current page.
 */
export function generateCanonicalURL(
  currentPath: string,
  siteUrl: string,
): string {
  const base = siteUrl.replace(/\/$/, '');
  return `${base}${currentPath}`;
}

/**
 * Converts a locale HTML lang value to OG locale format (xx_YY).
 * "en" → "en_US", "es" → "es_ES", "en-GB" → "en_GB", "pt-BR" → "pt_BR"
 */
export function toOGLocale(htmlLang: string): string {
  if (htmlLang.includes('-')) {
    const [lang, region] = htmlLang.split('-');
    return `${lang}_${region.toUpperCase()}`;
  }
  // For simple codes, duplicate: "en" → "en_US" for English, else "xx" → "xx_XX"
  const upper = htmlLang.toUpperCase();
  if (htmlLang === 'en') return 'en_US';
  if (htmlLang === 'pt') return 'pt_PT';
  return `${htmlLang}_${upper}`;
}

/**
 * Generates Open Graph locale values for the current page and its alternates.
 */
export function generateOGLocales(
  currentPath: string,
  locales: string[],
  defaultLocale: string,
  localeHtmlLang: Record<string, string>,
  getLocaleFromPath: (pathname: string) => string,
): OGLocaleResult {
  const currentLocale = getLocaleFromPath(currentPath);
  const currentHtmlLang = localeHtmlLang[currentLocale] ?? currentLocale;

  const alternates: string[] = [];
  for (const locale of locales) {
    if (locale === currentLocale) continue;
    const htmlLang = localeHtmlLang[locale] ?? locale;
    alternates.push(toOGLocale(htmlLang));
  }

  return {
    current: toOGLocale(currentHtmlLang),
    alternates,
  };
}
