import { it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { CoreIcon } from '@squircle-icons/core/catalog-types';
const icons: CoreIcon[] = JSON.parse(
  await readFile(fileURLToPath(import.meta.resolve('@squircle-icons/core/catalog.json')), 'utf8'),
);
it('consumes fifty-one validated icons from the pinned core artifact', () => {
  expect(icons).toHaveLength(51);
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

it('retains prior approvals while reopening Menu and Trash revisions', () => {
  expect(icons.filter((icon) => icon.metadata.review?.status === 'approved')).toHaveLength(10);
  expect(
    icons.filter((icon) => icon.metadata.review?.status !== 'approved').map((icon) => icon.name),
  ).toEqual([
    'align-center',
    'align-left',
    'align-right',
    'arrow-down-left',
    'arrow-down-right',
    'arrow-down',
    'arrow-left',
    'arrow-right',
    'arrow-up-left',
    'arrow-up-right',
    'arrow-up',
    'check',
    'chevron-down',
    'chevron-left-right',
    'chevron-left',
    'chevron-line-down',
    'chevron-line-left',
    'chevron-line-right',
    'chevron-line-up',
    'chevron-right',
    'chevron-up-down',
    'chevron-up',
    'chevrons-down',
    'chevrons-left',
    'chevrons-right',
    'chevrons-up',
    'copy',
    'corner-up-right',
    'external-link',
    'log-in',
    'log-out',
    'maximize',
    'menu',
    'minus',
    'more-horizontal',
    'more-vertical',
    'new-tab',
    'new-window',
    'plus',
    'trash',
    'x',
  ]);
  for (const icon of icons) {
    expect(icon.filled).toBeDefined();
    expect(icon.filled?.metadata.review?.status).toBe(icon.metadata.review?.status);
  }
});
