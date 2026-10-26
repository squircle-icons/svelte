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

it('keeps the next six draft pairs out of the approved set', () => {
  const draftNames = ['arrow-left', 'arrow-right', 'menu', 'download', 'upload', 'trash'];
  for (const name of draftNames) {
    const icon = icons.find((icon) => icon.name === name);
    expect(icon?.metadata.review?.status ?? 'draft').toBe('draft');
    expect(icon?.filled).toBeDefined();
  }
});
