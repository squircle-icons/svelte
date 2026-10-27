import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { assertReleaseReady } from '../../tools/release-check.js';
import { flattenCoreIcons } from '../../tools/static-icons.js';

const icons = flattenCoreIcons(
  JSON.parse(
    await readFile(new URL(import.meta.resolve('@squircle-icons/core/catalog.json')), 'utf8'),
  ),
);

it('permits the current owner-approved collection and rejects an empty release', () => {
  expect(() => assertReleaseReady(icons)).not.toThrow();
  expect(() => assertReleaseReady([])).toThrow('empty icon collection');
});

it.each(['none', 'square', 'circle'] as const)(
  'blocks a draft %s drawing in either style without changing the source',
  (frame) => {
    const icon = icons.find((icon) => icon.frame === frame)!;
    const review = { ...icon.metadata.review!, status: 'draft' as const };
    expect(() => assertReleaseReady([{ ...icon, metadata: { ...icon.metadata, review } }])).toThrow(
      icon.name,
    );
    expect(() =>
      assertReleaseReady([
        { ...icon, filled: { ...icon.filled!, metadata: { ...icon.filled!.metadata, review } } },
      ]),
    ).toThrow(icon.name);
    expect(() => assertReleaseReady([icon])).not.toThrow();
  },
);
