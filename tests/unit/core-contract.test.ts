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

it('retains owner approval on all authoring sources and styles', () => {
  expect(icons.filter((icon) => icon.metadata.review?.status === 'approved')).toHaveLength(51);
  for (const icon of icons) {
    expect(icon.filled).toBeDefined();
    expect(icon.filled?.metadata.review?.status).toBe('approved');
  }
  expect(icons.filter((icon) => icon.frames?.square && icon.frames?.circle)).toHaveLength(35);
});

it('advertises no frame variants for icons without explicit owner frame approval', () => {
  for (const name of ['maximize', 'minimize', 'external-link']) {
    const icon = icons.find((icon) => icon.name === name);
    expect(icon, name).toBeDefined();
    expect(icon!.frames, name).toBeUndefined();
  }
});

it('represents New Tab through Plus Square without a duplicate package identity', async () => {
  expect(icons.find((icon) => icon.name === 'new-tab')).toBeUndefined();
  const plus = icons.find((icon) => icon.name === 'plus')!;
  expect(plus.frames?.square).toBeDefined();
  expect(plus.metadata.tags.join(' ')).toMatch(/new.?tab/);
  const manifest = JSON.parse(
    await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
  );
  for (const key of ['./new-tab', './filled/new-tab'])
    expect(manifest.exports[key]).toBeUndefined();
});
