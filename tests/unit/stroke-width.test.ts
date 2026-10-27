import { expect, it } from 'vitest';
import { resolveStrokeWidth } from '../../src/lib/stroke-width.js';

it.each([
  ['thin', 1.25],
  ['regular', 1.75],
  ['bold', 2.5],
  [1.9, 1.9],
  [0, 0],
  [-1, 1.75],
  [NaN, 1.75],
  [Infinity, 1.75],
  [-Infinity, 1.75],
] as const)('resolves stroke width %s to %s', (value, expected) =>
  expect(resolveStrokeWidth(value)).toBe(expected),
);
