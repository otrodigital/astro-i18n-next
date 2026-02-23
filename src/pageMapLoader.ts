import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, posix } from 'node:path';
import type { PageEntry, SlugMap } from './types';

/**
 * Recursively collects .astro files, skipping dynamic routes and directories.
 */
function collectAstroFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('[')) continue;

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectAstroFiles(fullPath));
    } else if (entry.name.endsWith('.astro') && !entry.name.includes('[')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extracts `export const slugs = { ... }` from .astro frontmatter.
 * Returns null if no slugs export is found.
 */
function parseSlugsExport(raw: string): Record<string, string> | null {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return null;

  const frontmatter = fmMatch[1];
  const slugsMatch = frontmatter.match(
    /export\s+const\s+slugs\s*=\s*(\{[^}]+\})/,
  );
  if (!slugsMatch) return null;

  let obj = slugsMatch[1];
  obj = obj.replace(/'/g, '"');
  obj = obj.replace(/(\w+)\s*:/g, '"$1":');
  obj = obj.replace(/,\s*}/, '}');

  try {
    return JSON.parse(obj);
  } catch {
    return null;
  }
}

/**
 * Synchronously scans a pages directory for .astro files and builds
 * a page map with entrypoints and locale-specific slugs, plus the
 * derived slug map for route helpers.
 *
 * @param pagesDir - Relative path from project root (e.g. 'src/pages')
 * @param locales  - Array of locale codes (e.g. ['en', 'es'])
 */
export function loadPageMapSync(
  pagesDir: string,
  locales: string[],
): { pages: Record<string, PageEntry>; pageSlugMap: SlugMap } {
  const absDir = join(process.cwd(), pagesDir);
  const files = collectAstroFiles(absDir);
  const pages: Record<string, PageEntry> = {};

  for (const filePath of files) {
    const rel = relative(absDir, filePath).replace(/\\/g, '/');
    let key = rel.replace(/\.astro$/, '');
    if (key.endsWith('/index')) {
      key = key.slice(0, -'/index'.length);
    }

    const entrypoint = posix.join(pagesDir, rel);

    const defaultSlug = key === 'index' ? '' : key;
    const defaultSlugs = Object.fromEntries(
      locales.map((l) => [l, defaultSlug]),
    );

    const raw = readFileSync(filePath, 'utf-8');
    const explicitSlugs = parseSlugsExport(raw);

    pages[key] = {
      entrypoint,
      slugs: { ...defaultSlugs, ...(explicitSlugs ?? {}) },
    };
  }

  const pageSlugMap: SlugMap = Object.fromEntries(
    Object.entries(pages).map(([key, { slugs }]) => [key, slugs]),
  );

  return { pages, pageSlugMap };
}
