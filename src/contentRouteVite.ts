import { join } from 'node:path';
import type { ContentRouteConfig, SlugMap } from './types.js';

interface ContentRoutePluginOptions {
  contentRoutes: Record<string, ContentRouteConfig>;
  slugMaps: Record<string, SlugMap>;
  locales: string[];
  defaultLocale: string;
}

const VIRTUAL_PREFIX = 'virtual:content-route/';
const RESOLVED_PREFIX = '\0' + VIRTUAL_PREFIX;

/**
 * Creates a Vite plugin that generates per-locale virtual entrypoints
 * for content collection routes. Each virtual module re-exports the
 * template component and provides a filtered getStaticPaths().
 */
export function createContentRoutePlugin(options: ContentRoutePluginOptions) {
  const { contentRoutes, slugMaps } = options;

  // Pre-resolve absolute template paths
  const templatePaths: Record<string, string> = {};
  for (const [routeKey, routeConfig] of Object.entries(contentRoutes)) {
    templatePaths[routeKey] = '/' + routeConfig.template;
  }

  return {
    name: 'i18n-content-routes',

    resolveId(id: string) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        return '\0' + id;
      }
    },

    load(id: string) {
      if (!id.startsWith(RESOLVED_PREFIX)) return;

      const rest = id.slice(RESOLVED_PREFIX.length);
      const slashIndex = rest.indexOf('/');
      if (slashIndex === -1) return;

      const routeKey = rest.slice(0, slashIndex);
      const locale = rest.slice(slashIndex + 1);

      const templatePath = templatePaths[routeKey];
      if (!templatePath) return;

      const slugMap = slugMaps[routeKey];
      if (!slugMap) {
        return `
export { default } from '${templatePath}';
export function getStaticPaths() { return []; }
`;
      }

      const entries = Object.entries(slugMap).map(([canonical, slugsByLocale]) => {
        const localized = slugsByLocale[locale] ?? canonical;
        return `    { params: { slug: '${localized}' }, props: { canonicalSlug: '${canonical}' } }`;
      });

      return `export { default } from '${templatePath}';

export function getStaticPaths() {
  return [
${entries.join(',\n')}
  ];
}
`;
    },
  };
}
