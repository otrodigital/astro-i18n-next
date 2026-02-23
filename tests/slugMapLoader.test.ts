import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { loadSlugMapSync } from '../src/slugMapLoader';

const contentDir = join(import.meta.dirname, '__fixtures__', 'content');

describe('loadSlugMapSync', () => {
  it('reads markdown files and extracts slug maps', () => {
    const slugMap = loadSlugMapSync(contentDir);

    expect(slugMap['model-165']).toEqual({
      en: 'model-165',
      es: 'modelo-165',
    });
  });

  it('uses filename without .md as the ID', () => {
    const slugMap = loadSlugMapSync(contentDir);

    expect(Object.keys(slugMap)).toContain('model-165');
  });
});
