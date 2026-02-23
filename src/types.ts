export interface LocaleConfig {
  defaultLocale: string;
  locales: string[];
  localeLabels: Record<string, string>;
  localeHtmlLang: Record<string, string>;
}

export type SlugMap = Record<string, Record<string, string>>;

export interface PageEntry {
  entrypoint: string;
  slugs: Record<string, string>;
}

export interface I18nextOptions {
  /** i18next plugin modules to register via .use() */
  plugins?: any[];
  /** Additional i18next init options (merged with defaults) */
  options?: Record<string, unknown>;
}

export interface I18nConfig extends LocaleConfig {
  translations: Record<string, Record<string, unknown>>;
  /** Provide slug maps directly, or use pagesDir/contentDirs to auto-discover */
  slugMaps?: Record<string, SlugMap>;
  /** Relative path to the pages directory (e.g. 'src/pages') — auto-discovers page slugs */
  pagesDir?: string;
  /** Content directories to scan for slug maps (e.g. { saunas: 'src/content/saunas' }) */
  contentDirs?: Record<string, string>;
  /** i18next plugins and configuration */
  i18next?: I18nextOptions;
}

export interface I18nInstance {
  t: (locale: string, key: string) => string;
  localePath: (locale: string, path: string) => string;
  switchLocalePath: (currentPath: string, targetLocale: string) => string;
  getLocaleFromPath: (pathname: string) => string;
  localized: <T>(field: Record<string, T>, locale: string) => T;
  getLocalizedSlug: (category: string, canonicalSlug: string, locale: string) => string;
  getCanonicalSlug: (category: string, localizedSlug: string, locale: string) => string | undefined;
}
