import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { assertReleaseReady } from '../../tools/release-check.js';
const icons = JSON.parse(
  await readFile(new URL(import.meta.resolve('@squircle-icons/core/catalog.json')), 'utf8'),
);
it('allows the authorized alpha without changing source review status, but blocks stable drafts', () => {
  const before = JSON.stringify(icons);
  expect(() => assertReleaseReady(icons, '0.2.0-alpha.0')).not.toThrow();
  expect(() => assertReleaseReady(icons, '0.2.0')).toThrow('Unapproved');
  expect(JSON.stringify(icons)).toBe(before);
});
it('rejects empty, duplicate, incomplete and missing-review source data', () => {
  expect(() => assertReleaseReady([], '0.2.0-alpha.0')).toThrow('empty');
  expect(() => assertReleaseReady([icons[0], icons[0]], '0.2.0-alpha.0')).toThrow('Duplicate');
  expect(() => assertReleaseReady([{ ...icons[0], filled: undefined }], '0.2.0-alpha.0')).toThrow(
    'Incomplete',
  );
  expect(() =>
    assertReleaseReady(
      [{ ...icons[0], metadata: { ...icons[0].metadata, review: undefined } }],
      '0.2.0-alpha.0',
    ),
  ).toThrow('review');
});
