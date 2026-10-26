import { expect, it } from 'vitest';
import { resolveStrokeWidth } from '../../src/lib/stroke-width.js';

it.each([
  ['thin', 1.25],
  ['regular', 1.7],
  ['bold', 2.25],
  [1.9, 1.9],
] as const)('resolves stroke width %s to %s', (value, expected) =>
  expect(resolveStrokeWidth(value)).toBe(expected),
);
