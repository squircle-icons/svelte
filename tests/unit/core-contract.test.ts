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

it('keeps the seven pending pairs out of the owner-approved set', () => {
  const draftNames = [
    'arrow-left',
    'arrow-right',
    'check',
    'chevron-down',
    'chevron-up',
    'download',
    'upload',
  ];
  expect(icons.filter((icon) => icon.metadata.review?.status === 'approved')).toHaveLength(13);
  for (const name of draftNames) {
    const icon = icons.find((icon) => icon.name === name);
    expect(icon?.metadata.review?.status ?? 'draft').toBe('draft');
    expect(icon?.filled).toBeDefined();
  }
});
