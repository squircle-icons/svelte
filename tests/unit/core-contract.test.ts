import { it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { CoreIcon } from '@squircle-icons/core/catalog-types';
const icons: CoreIcon[] = JSON.parse(
  await readFile(fileURLToPath(import.meta.resolve('@squircle-icons/core/catalog.json')), 'utf8'),
);
it('consumes twenty-six validated icons from the pinned core artifact', () => {
  expect(icons).toHaveLength(26);
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

it('retains eighteen approvals and eight draft arrows with frames', () => {
  expect(icons.filter((icon) => icon.metadata.review?.status === 'approved')).toHaveLength(18);
  expect(
    icons.filter((icon) => icon.metadata.review?.status !== 'approved').map((icon) => icon.name),
  ).toEqual([
    'arrow-down-left',
    'arrow-down-right',
    'arrow-down',
    'arrow-left',
    'arrow-right',
    'arrow-up-left',
    'arrow-up-right',
    'arrow-up',
  ]);
  for (const icon of icons) {
    expect(icon.filled).toBeDefined();
    expect(icon.filled?.metadata.review?.status).toBe(icon.metadata.review?.status);
  }
});
