import { expect, it } from 'vitest';
import { componentNames } from '../../tools/icon-names.js';

it.each([
  'camera-',
  'camera--lens',
  'filled',
  'icon-props',
  'icon-style',
  'icon-stroke-width',
  'filled-icon-props',
])('rejects invalid or reserved name %s', (name) => expect(() => componentNames([name])).toThrow());
it('rejects names that would overwrite the same component', () => {
  expect(() => componentNames(['camera2', 'camera-2'])).toThrow('Duplicate');
});
it('keeps valid independent component names', () => {
  expect(componentNames(['camera', 'chevron-down'])).toEqual(['Camera', 'ChevronDown']);
});

it('rejects filenames that collide on case-insensitive filesystems', () => {
  expect(() => componentNames(['github', 'git-hub'])).toThrow('Duplicate component filename');
});
