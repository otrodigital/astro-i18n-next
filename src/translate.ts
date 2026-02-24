import i18next from 'i18next';
import type { I18nextOptions } from './types.js';

/**
 * Initializes i18next with the provided translations, optional plugins,
 * and extra configuration. Returns a translation function.
 */
export function createTranslator(
  translations: Record<string, Record<string, unknown>>,
  defaultLocale: string,
  i18nextConfig?: I18nextOptions,
) {
  const resources: Record<string, { translation: Record<string, unknown> }> = {};
  for (const [locale, data] of Object.entries(translations)) {
    resources[locale] = { translation: data };
  }

  const instance = i18next.createInstance();

  // Register plugins
  if (i18nextConfig?.plugins) {
    for (const plugin of i18nextConfig.plugins) {
      instance.use(plugin);
    }
  }

  instance.init({
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    resources,
    interpolation: { escapeValue: false },
    returnNull: false,
    ...i18nextConfig?.options,
  });

  return function t(locale: string, key: string): string {
    return instance.t(key, { lng: locale }) as string;
  };
}
