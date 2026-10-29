import { readFile } from 'node:fs/promises';
import { expect, expectTypeOf, it } from 'vitest';
import type { CoreIcon } from '@squircle-icons/core/catalog-types';
import type { IconProps } from '../../src/lib/props.js';
import { componentNames } from '../../tools/icon-names.js';
import { flattenCoreIcons } from '../../tools/static-icons.js';

const sources: CoreIcon[] = JSON.parse(
  await readFile(new URL(import.meta.resolve('@squircle-icons/core/catalog.json')), 'utf8'),
);

it('gives every authored frame its own unique static identity and component name', () => {
  const icons = flattenCoreIcons(sources);
  expect(icons).toHaveLength(121);
  expect(icons.filter((icon) => icon.frame === 'none')).toHaveLength(51);
  expect(icons.filter((icon) => icon.frame === 'square')).toHaveLength(35);
  expect(icons.filter((icon) => icon.frame === 'circle')).toHaveLength(35);
  expect(new Set(icons.map((icon) => icon.name)).size).toBe(icons.length);
  expect(componentNames(icons.map((icon) => icon.name))).toEqual(
    expect.arrayContaining(['Plus', 'PlusSquare', 'ArrowLeftCircle']),
  );
});

it('retains only the selected drawing and its approval without changing Core authoring data', () => {
  const before = JSON.stringify(sources);
  const icons = flattenCoreIcons(sources);
  for (const source of sources) {
    const plain = icons.find((icon) => icon.name === source.name)!;
    expect(plain.frame).toBe('none');
    expect(plain.baseIcon).toBe(source.name);
    expect(plain.root).toBe(source.root);
    expect(plain.filled).toBe(source.filled);
    expect(plain.metadata.supportsBold).toBe(source.metadata.supportsBold);
    for (const frame of ['square', 'circle'] as const) {
      const variant = source.frames?.[frame];
      if (!variant) continue;
      const explicit = icons.find((icon) => icon.name === `${source.name}-${frame}`)!;
      expect(explicit.baseIcon).toBe(source.name);
      expect(explicit.frame).toBe(frame);
      expect(explicit.metadata.name).toBe(explicit.name);
      expect(explicit.filled?.metadata.name).toBe(explicit.name);
      expect(explicit.metadata.supportsBold).toBe(false);
      expect(explicit.filled?.metadata.supportsBold).toBe(false);
      expect(explicit.root).toBe(variant.root);
      expect(explicit.filled?.root).toBe(variant.filled.root);
      expect(explicit.metadata.review).toBe(variant.metadata.review);
      expect(explicit.filled?.metadata.review).toBe(variant.filled.metadata.review);
    }
  }
  for (const icon of icons) expect(Object.hasOwn(icon, 'frames')).toBe(false);
  expect(JSON.stringify(sources)).toBe(before);
});

it('rejects collisions between standalone names and explicit frame identities', () => {
  const source = sources.find((icon) => icon.frames?.square)!;
  const name = `${source.name}-square`;
  const collision: CoreIcon = {
    ...source,
    name,
    metadata: { ...source.metadata, name },
    frames: undefined,
  };
  expect(() => flattenCoreIcons([source, collision])).toThrow('collides');
});

it('does not expose a frame-selection prop on static icon APIs', () => {
  expectTypeOf<IconProps>().not.toHaveProperty('frame');
});
