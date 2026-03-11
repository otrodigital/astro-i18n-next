import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, posix } from 'node:path';
import type { ContentRouteConfig, SlugMap } from './types.js';

const CACHE_DIR = 'node_modules/.astro-i18n-cache';

interface ContentRouteFilesOptions {
  contentRoutes: Record<string, ContentRouteConfig>;
  slugMaps: Record<string, SlugMap>;
  locales: string[];
  defaultLocale: string;
}

/**
 * Writes real .astro temp files for each locale x content route combination.
 * Each file imports the template, provides a locale-filtered getStaticPaths(),
 * and renders via <Template {...props} />.
 *
 * Returns a map of `${routeKey}/${locale}` → file path for use with injectRoute.
 */
export function writeContentRouteFiles(options: ContentRouteFilesOptions): Record<string, string> {
  const { contentRoutes, slugMaps, locales } = options;
  const cacheDir = join(process.cwd(), CACHE_DIR);
  const entrypoints: Record<string, string> = {};

  mkdirSync(cacheDir, { recursive: true });

  for (const [routeKey, routeConfig] of Object.entries(contentRoutes)) {
    const routeDir = join(cacheDir, routeKey);
    mkdirSync(routeDir, { recursive: true });

    // Compute relative import path from cache dir to template
    const templateAbsolute = join(process.cwd(), routeConfig.template);
    const relativePath = posix.join(
      ...relative(routeDir, templateAbsolute).split(/[\\/]/),
    );

    const slugMap = slugMaps[routeKey];

    for (const locale of locales) {
      const fileName = `${locale}.astro`;
      const filePath = join(routeDir, fileName);

      let staticPaths: string;
      if (!slugMap || Object.keys(slugMap).length === 0) {
        staticPaths = '  return [];';
      } else {
        const entries = Object.entries(slugMap).map(([canonical, slugsByLocale]) => {
          const localized = slugsByLocale[locale] ?? canonical;
          return `    { params: { slug: '${localized}' }, props: { canonicalSlug: '${canonical}' } }`;
        });
        staticPaths = `  return [\n${entries.join(',\n')}\n  ];`;
      }

      const content = `---
import Template from '${relativePath}';

export function getStaticPaths() {
${staticPaths}
}

const props = Astro.props;
---
<Template {...props} />
`;

      writeFileSync(filePath, content, 'utf-8');
      entrypoints[`${routeKey}/${locale}`] = filePath;
    }
  }

  return entrypoints;
}
