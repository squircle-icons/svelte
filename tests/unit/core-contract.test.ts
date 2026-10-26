import { it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { CoreIcon } from '@squircle-icons/core/catalog-types';
const icons: CoreIcon[] = JSON.parse(
  await readFile(fileURLToPath(import.meta.resolve('@squircle-icons/core/catalog.json')), 'utf8'),
);
it('consumes eight validated icons and two recipes from the pinned core artifact', () => {
  expect(icons).toHaveLength(8);
  expect(icons.filter((icon) => icon.motion)).toHaveLength(2);
});
it('has complete stable-part references across every adapter input', () => {
  for (const icon of icons)
    for (const part of Object.keys(icon.motion?.origins ?? {})) expect(icon.parts).toContain(part);
});
it('keeps runtime input framework independent and import-time DOM free', async () => {
  const source = await readFile(
    fileURLToPath(import.meta.resolve('@squircle-icons/core/source/controller')),
    'utf8',
  );
  expect(source).not.toMatch(/from ['"](?:svelte|react|vue|@angular)/);
  expect(typeof window).toBe('undefined');
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
