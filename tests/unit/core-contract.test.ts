import { it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { CoreIcon } from '@squircle-icons/core/catalog-types';
const icons: CoreIcon[] = JSON.parse(
  await readFile(fileURLToPath(import.meta.resolve('@squircle-icons/core/catalog.json')), 'utf8'),
);
it('consumes twenty validated icons from the pinned core artifact', () => {
  expect(icons).toHaveLength(20);
});
it('consumes validated fill-only Folder geometry with a deliberate cutout', () => {
  const filled = icons.find((icon) => icon.name === 'folder')?.filled;
  expect(filled?.root.attrs).toMatchObject({
    fill: 'currentColor',
    stroke: 'none',
    'fill-rule': 'evenodd',
  });
  expect(filled?.parts).toEqual(['body']);
});

it('consumes all twenty owner-approved pairs from the pinned source', () => {
  expect(icons.filter((icon) => icon.metadata.review?.status === 'approved')).toHaveLength(20);
  for (const icon of icons) {
    expect(icon.filled).toBeDefined();
    expect(icon.filled?.metadata.review?.status).toBe('approved');
  }
});
