import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { SlugMap } from './types';

/**
 * Reads all .md files from a content directory and extracts the `slugs`
 * field from their YAML frontmatter. Runs synchronously so slug maps
 * are available at module-evaluation time for injectRoute() and localePath().
 *
 * @param contentDir - Absolute path to the content directory
 */
export function loadSlugMapSync(contentDir: string): SlugMap {
  const files = readdirSync(contentDir).filter((f: string) => f.endsWith('.md'));
  const map: SlugMap = {};

  for (const file of files) {
    const raw = readFileSync(join(contentDir, file), 'utf-8');
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) continue;

    const frontmatter = yaml.load(match[1]) as Record<string, any>;
    if (frontmatter?.slugs) {
      const id = file.replace(/\.md$/, '');
      map[id] = frontmatter.slugs;
    }
  }

  return map;
}
