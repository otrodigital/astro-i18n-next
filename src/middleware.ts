import type { MiddlewareHandler } from 'astro';
import type { LocaleConfig } from './types';

/**
 * Creates Astro middleware that detects the locale from the URL
 * and sets it on Astro.locals.locale.
 */
export function createI18nMiddleware(config: LocaleConfig): MiddlewareHandler {
  return (context, next) => {
    const segments = context.url.pathname.split('/').filter(Boolean);
    const first = segments[0];

    if (first && config.locales.includes(first) && first !== config.defaultLocale) {
      (context.locals as Record<string, unknown>).locale = first;
    } else {
      (context.locals as Record<string, unknown>).locale = config.defaultLocale;
    }

    return next();
  };
}
