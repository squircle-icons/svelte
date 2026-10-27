import { expect, test } from '@playwright/test';
const arrows = [
  'arrow-left',
  'arrow-right',
  'arrow-up',
  'arrow-down',
  'arrow-up-left',
  'arrow-up-right',
  'arrow-down-left',
  'arrow-down-right',
  'chevron-up',
  'chevron-up-right',
  'chevron-right',
  'chevron-down-right',
  'chevron-down',
  'chevron-down-left',
  'chevron-left',
  'chevron-up-left',
];
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
});
test('Square and Circle use the identical standalone glyph, fixed frames and matching Filled cutouts', async ({
  page,
}, info) => {
  const originals = await page.evaluate(
    (names) =>
      Object.fromEntries(
        names.map((name) => [
          name,
          {
            outline: document
              .querySelector(`[data-testid="${name}-outline-contour"] path`)!
              .getAttribute('d'),
            filled: [
              ...document.querySelectorAll(`[data-testid="${name}-filled-contour"] path`),
            ].map((path) => path.getAttribute('d')!),
          },
        ]),
      ),
    arrows,
  );
  for (const frame of ['square', 'circle']) {
    await page.getByLabel('Fixture arrow frame').selectOption(frame);
    for (const icon of arrows) {
      const result = await page.evaluate(
        ({ icon, original }) => {
          const outline = document.querySelector(
            `[data-testid="${icon}-outline-contour"] svg`,
          )! as SVGSVGElement;
          const filled = document.querySelector(
            `[data-testid="${icon}-filled-contour"] svg`,
          )! as SVGSVGElement;
          const glyph = [...outline.querySelectorAll('path')].at(-1)!;
          const path = filled.querySelector('path')!;
          const parts = path.getAttribute('d')!.match(/[Mm][^Mm]*/g)!;
          if (parts.length !== 2) throw new Error('Expected one solid frame and one arrow hole');
          const hole = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          hole.setAttribute('d', parts[1]);
          hole.setAttribute('visibility', 'hidden');
          filled.append(hole);
          const reference = original.filled.map((d) => {
            const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            shape.setAttribute('d', d);
            shape.setAttribute('visibility', 'hidden');
            filled.append(shape);
            return shape;
          });
          let mismatches = 0;
          for (let x = 3.17; x < 21; x += 0.4)
            for (let y = 3.17; y < 21; y += 0.4) {
              const point = new DOMPoint(x, y);
              if (
                hole.isPointInFill(point) !== reference.some((shape) => shape.isPointInFill(point))
              )
                mismatches++;
            }
          hole.remove();
          reference.forEach((shape) => shape.remove());
          const b = filled.getBBox();
          return {
            glyph: glyph.getAttribute('d'),
            mismatches,
            margins: [b.x, b.y, 24 - b.x - b.width, 24 - b.y - b.height],
            emptyCenter: !path.isPointInFill(new DOMPoint(12, 12)),
            solidBorder: path.isPointInFill(new DOMPoint(3, 12)),
          };
        },
        { icon, original: originals[icon] },
      );
      expect(result.glyph).toBe(originals[icon].outline);
      expect(result.mismatches).toBeLessThanOrEqual(4);
      for (const margin of result.margins) expect(margin).toBeCloseTo(2, 4);
      expect(result.emptyCenter).toBe(true);
      expect(result.solidBorder).toBe(true);
    }
    if (info.project.name === 'chromium')
      await page
        .getByTestId('round-five-light')
        .screenshot({ path: `.artifacts/previews/arrow-frames-${frame}.png` });
  }
});
test('even Bold leaves clearance between the arrow and either frame in every direction', async ({
  page,
}) => {
  await page.getByLabel('Fixture arrow weight').selectOption('2.5');
  for (const frame of ['square', 'circle']) {
    await page.getByLabel('Fixture arrow frame').selectOption(frame);
    const clear = await page.evaluate(
      (names) =>
        names.every((icon) => {
          const svg = document.querySelector(`[data-testid="${icon}-outline-contour"] svg`)!;
          const paths = [...svg.querySelectorAll('path')];
          const values = paths
            .at(-1)!
            .getAttribute('d')!
            .match(/-?\d*\.?\d+/g)!
            .map(Number);
          return values.every((_, index) => {
            if (index % 2) return true;
            const dx = values[index] - 12,
              dy = values[index + 1] - 12,
              length = Math.hypot(dx, dy);
            const point = new DOMPoint(12 + (dx / length) * 7.625, 12 + (dy / length) * 7.625);
            return ![...svg.querySelectorAll<SVGGeometryElement>('path,circle')].some((shape) =>
              shape.isPointInStroke(point),
            );
          });
        }),
      arrows,
    );
    expect(clear).toBe(true);
  }
});

test('Chevron provides 24 forms with equal arm lengths and centered glyphs', async ({
  page,
}, info) => {
  const sheet = page.getByTestId('chevron-proof');
  await expect(sheet.locator('svg')).toHaveCount(48);
  for (const frame of ['none', 'square', 'circle'])
    await expect(sheet.locator(`svg[data-frame="${frame}"]`)).toHaveCount(16);
  const geometry = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        '[data-testid^="chevron-"][data-testid$="-outline-contour"] svg path',
      ),
    ].map((path) => {
      const v = path
        .getAttribute('d')!
        .match(/-?\d*\.?\d+/g)!
        .map(Number);
      return [
        Math.hypot(v[2] - v[0], v[3] - v[1]),
        Math.hypot(v[4] - v[2], v[5] - v[3]),
        (Math.min(v[0], v[2], v[4]) + Math.max(v[0], v[2], v[4])) / 2,
        (Math.min(v[1], v[3], v[5]) + Math.max(v[1], v[3], v[5])) / 2,
      ];
    }),
  );
  expect(geometry).toHaveLength(8);
  for (const [a, b, x, y] of geometry) {
    expect(a).toBeCloseTo(5.5 * Math.SQRT2, 5);
    expect(b).toBeCloseTo(a, 5);
    expect(x).toBeCloseTo(12, 5);
    expect(y).toBeCloseTo(12, 5);
  }
  if (info.project.name === 'chromium')
    await sheet.screenshot({ path: '.artifacts/previews/chevron-24.png' });
});
