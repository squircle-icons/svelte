import { expect, it } from 'vitest';
import { resolveStrokeWidth } from '../../src/lib/stroke-width.js';

it.each([
  ['thin', 1.25],
  ['regular', 1.5],
  ['bold', 2.5],
  [1.9, 1.9],
  [0, 0],
  [-1, 1.5],
  [NaN, 1.5],
  [Infinity, 1.5],
  [-Infinity, 1.5],
] as const)('resolves stroke width %s to %s', (value, expected) =>
  expect(resolveStrokeWidth(value)).toBe(expected),
);
