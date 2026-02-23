# @otrodigital/astro-i18n-next

A complete internationalization module for Astro 5 static sites. Provides translated URL routing, content localization, multilingual markdown loading, and i18next-based translations — all through a single `createI18n` integration with a `virtual:i18n` module for component imports.

## Install

```bash
npm install @otrodigital/astro-i18n-next
```

Or as a local dependency:

```json
{
  "dependencies": {
    "@otrodigital/astro-i18n-next": "file:./modules/astro-i18n-next"
  }
}
```

### Peer dependencies

```
astro >= 5.0.0
i18next >= 23.0.0
js-yaml >= 4.0.0
marked >= 9.0.0
```

## Quick start

### 1. Add the integration in `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import { createI18n } from '@otrodigital/astro-i18n-next';
import en from './src/i18n/en.json' with { type: 'json' };
import es from './src/i18n/es.json' with { type: 'json' };

export default defineConfig({
  integrations: [createI18n({
    defaultLocale: 'en',
    locales: ['en', 'es'],
    localeLabels: { en: 'English', es: 'Español' },
    localeHtmlLang: { en: 'en', es: 'es' },
    translations: { en, es },
    pagesDir: 'src/pages',
    contentDirs: { saunas: 'src/content/saunas' },
  })],
});
```

That's it for config. The integration automatically:
- Scans `pagesDir` for `.astro` files and builds the page map
- Scans `contentDirs` for markdown slug maps
- Injects localized routes for all non-default locales
- Provides a `virtual:i18n` module with all i18n helpers

### 2. Add type declarations to `src/env.d.ts`

```ts
/// <reference types="astro/client" />

declare module 'virtual:i18n' {
  export const t: (locale: string, key: string) => string;
  export const localePath: (locale: string, path: string) => string;
  export const switchLocalePath: (currentPath: string, targetLocale: string) => string;
  export const getLocaleFromPath: (pathname: string) => string;
  export const localized: <T>(field: Record<string, T>, locale: string) => T;
  export const getLocalizedSlug: (category: string, canonicalSlug: string, locale: string) => string;
  export const getCanonicalSlug: (category: string, localizedSlug: string, locale: string) => string | undefined;
  export const config: import('@otrodigital/astro-i18n-next').LocaleConfig;
  export const defaultLocale: string;
  export const locales: string[];
  export const localeLabels: Record<string, string>;
  export const localeHtmlLang: Record<string, string>;
}
```

### 3. Add middleware for locale detection

```ts
// src/middleware.ts
import { createI18nMiddleware } from '@otrodigital/astro-i18n-next';
import { config } from 'virtual:i18n';

export const onRequest = createI18nMiddleware(config);
```

This sets `Astro.locals.locale` on every request based on the URL prefix.

### 4. Use in components

```astro
---
import { t, localePath, locales } from 'virtual:i18n';
const locale = Astro.locals.locale;
---
<h1>{t(locale, 'home.title')}</h1>
<a href={localePath(locale, '/about/')}>{t(locale, 'nav.about')}</a>
```

### 5. Optional: page slug exports

Pages can export translated slugs in their frontmatter:

```astro
---
export const slugs = { en: 'about', es: 'sobre' };
import { t, localePath } from 'virtual:i18n';
// ...
---
```

Pages without a slugs export default to the filename as the slug for all locales.

---

## API reference

### Types

#### `LocaleConfig`

```ts
interface LocaleConfig {
  defaultLocale: string;
  locales: string[];
  localeLabels: Record<string, string>;
  localeHtmlLang: Record<string, string>;
}
```

#### `SlugMap`

```ts
type SlugMap = Record<string, Record<string, string>>;
// Example: { 'about': { en: 'about', es: 'sobre' } }
```

#### `PageEntry`

```ts
interface PageEntry {
  entrypoint: string;             // Astro component path
  slugs: Record<string, string>;  // Locale-specific URL slugs
}
```

#### `I18nextOptions`

```ts
interface I18nextOptions {
  plugins?: any[];                  // i18next plugins (e.g. i18next-icu)
  options?: Record<string, unknown>; // Extra i18next init options
}
```

#### `I18nConfig`

Extends `LocaleConfig` with:

```ts
interface I18nConfig extends LocaleConfig {
  translations: Record<string, Record<string, unknown>>;
  slugMaps?: Record<string, SlugMap>;
  pagesDir?: string;                     // Auto-discover page slugs
  contentDirs?: Record<string, string>;  // Auto-discover content slugs
  i18next?: I18nextOptions;
}
```

#### `I18nInstance`

```ts
interface I18nInstance {
  t: (locale: string, key: string) => string;
  localePath: (locale: string, path: string) => string;
  switchLocalePath: (currentPath: string, targetLocale: string) => string;
  getLocaleFromPath: (pathname: string) => string;
  localized: <T>(field: Record<string, T>, locale: string) => T;
  getLocalizedSlug: (category: string, canonicalSlug: string, locale: string) => string;
  getCanonicalSlug: (category: string, localizedSlug: string, locale: string) => string | undefined;
}
```

---

### `createI18n(config)`

Creates an Astro integration that sets up i18n routing and provides a `virtual:i18n` module. This is the recommended way to set up i18n.

```js
// astro.config.mjs
import { createI18n } from '@otrodigital/astro-i18n-next';

export default defineConfig({
  integrations: [createI18n({
    defaultLocale: 'en',
    locales: ['en', 'es'],
    localeLabels: { en: 'English', es: 'Español' },
    localeHtmlLang: { en: 'en', es: 'es' },
    translations: { en, es },
    pagesDir: 'src/pages',
    contentDirs: { saunas: 'src/content/saunas' },
  })],
});
```

Returns an `AstroIntegration` that:
1. Auto-discovers page slugs from `pagesDir` via `loadPageMapSync`
2. Auto-discovers content slugs from `contentDirs` via `loadSlugMapSync`
3. Injects locale routes for all non-default locales
4. Serves a `virtual:i18n` Vite module exporting all i18n helpers and config values

#### The `virtual:i18n` module

Components import from `virtual:i18n` instead of re-exporting from config:

```astro
---
import { t, localePath, locales, localeHtmlLang } from 'virtual:i18n';
---
```

Exports: `t`, `localePath`, `switchLocalePath`, `getLocaleFromPath`, `localized`, `getLocalizedSlug`, `getCanonicalSlug`, `config`, `defaultLocale`, `locales`, `localeLabels`, `localeHtmlLang`.

#### i18next plugins and options

Pass custom i18next plugins (e.g. ICU message format) and init options via the `i18next` field:

```ts
import ICU from 'i18next-icu';

export default defineConfig({
  integrations: [createI18n({
    ...config,
    translations: { en, es },
    i18next: {
      plugins: [ICU],
      options: {
        supportedLngs: ['en', 'es'],
      },
    },
  })],
});
```

> **Note:** i18next plugins are not serializable and won't be available in the virtual module. Use the `i18next.options` field for serializable configuration.

---

### `createTranslator(translations, defaultLocale, i18nextConfig?)`

Initializes i18next and returns a translation function. Used internally by `createI18n`, but can also be called directly for standalone use.

```ts
const t = createTranslator({ en: enJson, es: esJson }, 'en');

t('en', 'nav.about');    // "About"
t('es', 'nav.about');    // "Acerca de"
t('es', 'missing.key');  // Falls back to English value
```

The optional third argument accepts `I18nextOptions` for plugins and custom init options.

- Supports dot-notation keys (`'section.subsection.key'`)
- Falls back to `defaultLocale` for missing translations
- HTML is not escaped (safe for `set:html`)
- Creates an isolated i18next instance (safe for multiple calls)

---

### `createRouteHelpers(defaultLocale, locales, slugMaps)`

Returns three functions for locale-aware URL generation.

#### `localePath(locale, path)`

Translates a canonical English path to a locale-specific path.

```ts
localePath('en', '/about/');              // "/about/"
localePath('es', '/about/');              // "/es/sobre/"
localePath('es', '/saunas/model-165/');   // "/es/saunas/modelo-165/"
```

#### `switchLocalePath(currentPath, targetLocale)`

Converts a path from one locale to another.

```ts
switchLocalePath('/es/saunas/modelo-165/', 'en');  // "/saunas/model-165/"
switchLocalePath('/about/', 'es');                  // "/es/sobre/"
```

#### `getLocaleFromPath(pathname)`

Extracts the locale from a URL pathname.

```ts
getLocaleFromPath('/es/sobre/');  // "es"
getLocaleFromPath('/about/');     // "en" (default)
```

---

### `createSlugResolver(slugMaps, defaultLocale)`

Returns functions for resolving slugs between canonical and localized forms.

#### `getLocalizedSlug(category, canonicalSlug, locale)`

```ts
getLocalizedSlug('saunas', 'model-165', 'es');  // "modelo-165"
getLocalizedSlug('saunas', 'model-165', 'en');  // "model-165"
```

#### `getCanonicalSlug(category, localizedSlug, locale)`

Reverse lookup — find the canonical slug from a localized one.

```ts
getCanonicalSlug('saunas', 'modelo-165', 'es');  // "model-165"
```

---

### `createContentHelper(defaultLocale)`

Returns a `localized()` function that extracts locale-specific values from multilingual field objects.

```ts
const localized = createContentHelper('en');

localized({ en: 'Hello', es: 'Hola' }, 'es');  // "Hola"
localized({ en: 'Hello' }, 'es');               // "Hello" (fallback)
```

Works with any field type — strings, arrays, objects.

---

### `createI18nIntegration({ config, pages })`

Low-level Astro integration that configures i18n routing at build time. Used internally by `createI18n`, but available for advanced use cases.

**What it does:**

1. Configures Astro's built-in i18n settings (`prefixDefaultLocale: false`, `redirectToDefaultLocale: true`)
2. Injects routes for every non-default locale using `injectRoute()`, mapping localized slugs to the original page entrypoints

---

### `createI18nMiddleware(config)`

Astro middleware that detects the locale from the URL and sets `Astro.locals.locale`.

- `/es/sobre/` → `locale = 'es'`
- `/about/` → `locale = 'en'` (default)

---

### `createMultilingualLoader({ contentDir })`

Astro 5 content loader for multilingual markdown files.

#### Markdown file format

```md
---
name:
  en: Model 165
  es: Modelo 165
slugs:
  en: model-165
  es: modelo-165
image: /images/model-165.jpg
description:
  en: Compact sauna solution
  es: Solución de sauna compacta
published: 2024-01-01
---

English body content with **markdown**.

<!-- locale:es -->

Contenido en español con **markdown**.
```

- Frontmatter fields can be localized objects (`{ en: ..., es: ... }`) or plain values
- Body content before the first `<!-- locale:XX -->` marker belongs to the default locale
- Each marker starts a new locale section

#### Schema example

```ts
import { createMultilingualLoader } from '@otrodigital/astro-i18n-next';

const saunas = defineCollection({
  loader: createMultilingualLoader({ contentDir: 'src/content/saunas' }),
  schema: z.object({
    name: z.object({ en: z.string(), es: z.string().optional() }),
    slugs: z.object({ en: z.string(), es: z.string().optional() }),
    image: z.string(),
    description: z.object({ en: z.string(), es: z.string().optional() }),
    published: z.coerce.date(),
    bodyHtml: z.record(z.string()).optional(),
  }),
});
```

---

### `loadSlugMapSync(contentDir)`

Synchronously reads `.md` files from an **absolute path** and extracts `slugs` from YAML frontmatter.

```ts
import { join } from 'node:path';
import { loadSlugMapSync } from '@otrodigital/astro-i18n-next';

const slugMap = loadSlugMapSync(join(process.cwd(), 'src/content/saunas'));
// { 'model-165': { en: 'model-165', es: 'modelo-165' }, ... }
```

---

### `loadPageMapSync(pagesDir, locales)`

Synchronously scans a pages directory for `.astro` files and builds a page map.

```ts
import { loadPageMapSync } from '@otrodigital/astro-i18n-next';

const { pages, pageSlugMap } = loadPageMapSync('src/pages', ['en', 'es']);
```

- `pagesDir` is a **relative path** from the project root
- Skips dynamic routes (files/directories containing `[`)
- Pages can optionally export slugs in their frontmatter
- Pages without a slugs export use the filename as the slug for all locales
