import type { Loader } from 'astro/loaders';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import yaml from 'js-yaml';
import { marked } from 'marked';

interface ContentLoaderOptions {
  contentDir: string;
}

/**
 * Parses a markdown file with YAML frontmatter delimited by `---`.
 * Returns the parsed frontmatter object and the raw body string.
 */
function parseFrontmatter(raw: string): { frontmatter: Record<string, any>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }
  const frontmatter = (yaml.load(match[1]) as Record<string, any>) ?? {};
  const body = match[2];
  return { frontmatter, body };
}

/**
 * Splits body content by `<!-- locale:XX -->` markers and renders each
 * locale's markdown to HTML. Content before the first marker belongs to
 * the default locale.
 */
function splitAndRenderBody(body: string, defaultLocale: string): Record<string, string> {
  const parts = body.split(/<!--\s*locale:(\w+)\s*-->/);
  const result: Record<string, string> = {};

  // First segment (index 0) is the default locale content
  const defaultBody = parts[0].trim();
  if (defaultBody) {
    result[defaultLocale] = marked.parse(defaultBody) as string;
  }

  // Remaining pairs: odd indices are locale codes, even indices are content
  for (let i = 1; i < parts.length; i += 2) {
    const locale = parts[i];
    const content = (parts[i + 1] ?? '').trim();
    if (content) {
      result[locale] = marked.parse(content) as string;
    }
  }

  return result;
}

/**
 * Creates an Astro 5 content loader that reads `.md` files from a directory,
 * parses multilingual frontmatter and body content, and stores entries with
 * pre-rendered HTML per locale.
 */
export function createMultilingualLoader(options: ContentLoaderOptions): Loader {
  return {
    name: 'multilingual-content',
    async load(context) {
      const { store, generateDigest, parseData } = context;
      const dir = resolve(options.contentDir);
      const files = await readdir(dir);

      store.clear();

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const id = file.replace(/\.md$/, '');
        const absolutePath = join(dir, file);
        const filePath = join(options.contentDir, file);
        const raw = await readFile(absolutePath, 'utf-8');

        const { frontmatter, body } = parseFrontmatter(raw);
        const bodyHtml = splitAndRenderBody(body, 'en');

        const data = await parseData({
          id,
          data: { ...frontmatter, bodyHtml },
          filePath,
        });

        const digest = generateDigest(raw);

        store.set({
          id,
          data,
          body,
          filePath,
          digest,
        });
      }
    },
  };
}
