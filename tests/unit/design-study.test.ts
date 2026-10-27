import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import {
  DEFAULT_ROUNDNESS,
  STUDY_STROKE,
  prototypeStudy,
  squircleStudy,
  type StudySubject,
} from '../../src/lib/design/squircle-base.js';
import { resolveStrokeWidth } from '../../src/lib/stroke-width.js';

const subjects: StudySubject[] = ['square', 'camera', 'folder'];

it('keeps the trial weight separate from the accepted collection palette and static catalog', async () => {
  expect(STUDY_STROKE).toBe(1.5);
  expect(resolveStrokeWidth('regular')).toBe(1.75);
  const catalog = JSON.parse(
    await readFile(new URL('../../src/lib/catalog.json', import.meta.url), 'utf8'),
  );
  expect(catalog.strokeWeights.regular).toBe(1.75);
  expect(catalog.icons).toHaveLength(121);
  expect(catalog.icons.some((icon: { name: string }) => icon.name === 'square')).toBe(false);
  const barrel = await readFile(new URL('../../src/lib/index.ts', import.meta.url), 'utf8');
  expect(barrel).not.toContain('design/squircle-base');
});

it.each(subjects)(
  'exports a finite, deterministic %s prototype in both styles across the supported trial range',
  (subject) => {
    for (const roundness of [2.4, 2.7, DEFAULT_ROUNDNESS, 4, 4.4]) {
      const shape = prototypeStudy(subject, roundness);
      expect(prototypeStudy(subject, roundness)).toEqual(shape);
      expect(shape.outline).not.toBe(shape.filled);
      for (const d of [shape.outline, shape.filled]) {
        expect(d).toMatch(/^M/);
        expect(d).not.toMatch(/NaN|Infinity|undefined/);
        const coordinates = d.match(/[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?/g)!;
        expect(coordinates.length).toBeGreaterThan(20);
        expect(coordinates.every((value) => Number.isFinite(Number(value)))).toBe(true);
      }
    }
    const rounder = prototypeStudy(subject, 2.7),
      squarer = prototypeStudy(subject, 4);
    expect(rounder.outline).not.toBe(squarer.outline);
    expect(rounder.filled).not.toBe(squarer.filled);
  },
);

it('uses the same base contour for the Square prototype without cloning it into other subjects', () => {
  expect(prototypeStudy('square')).toEqual(squircleStudy());
  expect(new Set(subjects.map((subject) => prototypeStudy(subject).outline)).size).toBe(3);
  expect(new Set(subjects.map((subject) => prototypeStudy(subject).filled)).size).toBe(3);
});
