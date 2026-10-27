import { expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';

type Entry = {
  name: string;
  baseIcon: string;
  frame: 'none' | 'square' | 'circle';
  frames: string[];
  styles: string[];
  reviewStatus: string;
};
const catalog: { icons: Entry[] } = JSON.parse(
  await readFile(new URL('../../src/lib/catalog.json', import.meta.url), 'utf8'),
);
const manifest = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));

it('publishes 121 distinct approved static identities from 51 originals and 70 explicit frames', () => {
  expect(catalog.icons).toHaveLength(121);
  expect(new Set(catalog.icons.map((icon) => icon.name)).size).toBe(121);
  expect(catalog.icons.filter((icon) => icon.frame === 'none')).toHaveLength(51);
  expect(catalog.icons.filter((icon) => icon.frame === 'square')).toHaveLength(35);
  expect(catalog.icons.filter((icon) => icon.frame === 'circle')).toHaveLength(35);
  for (const icon of catalog.icons) {
    expect(icon.reviewStatus, icon.name).toBe('approved');
    expect(icon.frames, icon.name).toEqual([]);
    expect(icon.styles, icon.name).toContain('outline');
    expect(icon.styles, icon.name).toContain('filled');
    expect(icon.name).toBe(icon.baseIcon + (icon.frame === 'none' ? '' : `-${icon.frame}`));
  }
});

it('provides an independent direct and Filled export for every explicit static identity', () => {
  for (const icon of catalog.icons) {
    expect(manifest.exports[`./${icon.name}`], icon.name).toBeDefined();
    expect(manifest.exports[`./filled/${icon.name}`], icon.name).toBeDefined();
  }
  for (const name of ['maximize', 'minimize', 'external-link'])
    for (const frame of ['square', 'circle'])
      expect(manifest.exports[`./${name}-${frame}`]).toBeUndefined();
});

it('keeps static frame choice out of public props and each component fixed to one identity', async () => {
  const props = await readFile(new URL('../../src/lib/props.ts', import.meta.url), 'utf8');
  expect(props).not.toMatch(/\bframe\s*\??\s*:/);
  for (const name of ['plus', 'plus-square', 'plus-circle']) {
    const componentName = name
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('');
    const source = await readFile(
      new URL(`../../src/lib/${componentName}.svelte`, import.meta.url),
      'utf8',
    );
    expect(source).not.toMatch(/(?:^|\s)frame\s*=/m);
    // Frame metadata is constant artwork provenance, never a selectable prop.
    expect(source).toContain(`data-frame="${name === 'plus' ? 'none' : name.slice(5)}"`);
  }
});
