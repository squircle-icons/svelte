import { expect, test } from '@playwright/test';
const arrows = [
  'chevron-up-down',
  'chevron-left-right',
  'chevron-line-up',
  'chevron-line-down',
  'chevron-line-left',
  'chevron-line-right',
  'arrow-left',
  'arrow-right',
  'arrow-up',
  'arrow-down',
  'arrow-up-left',
  'arrow-up-right',
  'arrow-down-left',
  'arrow-down-right',
  'chevron-up',
  'chevrons-up',
  'chevron-right',
  'chevrons-down',
  'chevron-down',
  'chevrons-left',
  'chevron-left',
  'chevrons-right',
];
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
});
test('Square and Circle retain the compact shared glyph while None is larger', async ({
  page,
}, info) => {
  const standalone = await page.evaluate(
    (names) =>
      Object.fromEntries(
        names.map((name) => {
          const glyph = document.querySelector(
            `[data-testid="${name}-outline-contour"] path`,
          )! as SVGPathElement;
          const b = glyph.getBBox();
          return [name, { d: glyph.getAttribute('d'), extent: Math.max(b.width, b.height) }];
        }),
      ),
    arrows,
  );
  await page.getByLabel('Fixture arrow frame').selectOption('square');
  const originals = await page.evaluate(
    (names) =>
      Object.fromEntries(
        names.map((name) => [
          name,
          {
            outline: document
              .querySelectorAll(`[data-testid="${name}-outline-contour"] path`)
              .item(1)
              .getAttribute('d'),
            extent: (() => {
              const glyph = document
                .querySelectorAll(`[data-testid="${name}-outline-contour"] path`)
                .item(1) as SVGPathElement;
              const b = glyph.getBBox();
              return Math.max(b.width, b.height);
            })(),
            filled: [
              ...document.querySelectorAll(`[data-testid="${name}-filled-contour"] path`),
            ].map((path) =>
              path
                .getAttribute('d')!
                .match(/[Mm][^Mm]*/g)!
                .slice(1)
                .join(' '),
            ),
          },
        ]),
      ),
    arrows,
  );
  for (const name of arrows) {
    expect(originals[name].outline).not.toBe(standalone[name].d);
    expect(standalone[name].extent).toBeGreaterThan(originals[name].extent);
  }
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
          if (parts.length < 2) throw new Error('Expected one solid frame and glyph cutout');
          const hole = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          hole.setAttribute('d', parts.slice(1).join(' '));
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
      if (
        !icon.startsWith('chevrons-') &&
        !['chevron-up-down', 'chevron-left-right'].includes(icon)
      )
        expect(result.emptyCenter).toBe(true);
      expect(result.solidBorder).toBe(true);
    }
    if (info.project.name === 'chromium')
      await page
        .getByTestId('round-five-light')
        .screenshot({ path: `.artifacts/previews/arrow-frames-${frame}.png` });
  }
  await page.getByLabel('Fixture arrow frame').selectOption('none');
  const native = await page.evaluate(
    (names) =>
      names.map((name) => {
        const glyph = document.querySelector(
          `[data-testid="${name}-outline-contour"] path`,
        )! as SVGPathElement;
        return {
          name,
          d: glyph.getAttribute('d'),
          stroke: glyph.ownerSVGElement!.getAttribute('stroke-width'),
        };
      }),
    arrows,
  );
  for (const item of native) {
    expect(item.d).toBe(standalone[item.name].d);
    expect(item.stroke).toBe('1.75');
  }
});
test('even Bold leaves clearance between the arrow and either frame in every direction', async ({
  page,
}) => {
  await page.getByLabel('Fixture arrow weight').selectOption('2.5');
  for (const frame of ['square', 'circle']) {
    await page.getByLabel('Fixture arrow frame').selectOption(frame);
    const clear = await page.evaluate(
      ({ names, frame }) =>
        names.every((icon) => {
          const svg = document.querySelector(`[data-testid="${icon}-outline-contour"] svg`)!;
          const paths = [...svg.querySelectorAll('path')];
          const values = paths
            .at(-1)!
            .getAttribute('d')!
            .match(/-?\d*\.?\d+/g)!
            .map(Number);
          // A radial probe can cross another part of a compound glyph (for
          // example a stop bar). Measure true clearance from each vertex to
          // the convex inner frame instead. Round joins/caps stay inside the
          // union of the centerline's radius-1.25 discs.
          const halfStroke = Number(svg.getAttribute('stroke-width')) / 2;
          const frameShape = svg.querySelector<SVGGeometryElement>('path,circle')!;
          const innerHalf = frameShape.getBBox().width / 2 - halfStroke;
          const innerCorner = 5.125 - halfStroke;
          return values.every((_, index) => {
            if (index % 2) return true;
            const dx = Math.abs(values[index] - 12),
              dy = Math.abs(values[index + 1] - 12);
            if (frame === 'circle') return innerHalf - Math.hypot(dx, dy) - halfStroke > 0;
            const qx = dx - (innerHalf - innerCorner),
              qy = dy - (innerHalf - innerCorner);
            const signedDistance =
              Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
              Math.min(Math.max(qx, qy), 0) -
              innerCorner;
            return -signedDistance - halfStroke > 0;
          });
        }),
      { names: arrows, frame },
    );
    expect(clear).toBe(true);
  }
});

test('Single and Double Chevron provide 24 forms with shared cardinal geometry', async ({
  page,
}, info) => {
  const sheet = page.getByTestId('chevron-proof');
  await expect(sheet.locator('svg')).toHaveCount(48);
  for (const frame of ['none', 'square', 'circle'])
    await expect(sheet.locator(`svg[data-frame="${frame}"]`)).toHaveCount(16);
  const geometry = await page.evaluate(() =>
    [...document.querySelectorAll('[data-testid$="-outline-contour"]')]
      .filter((el) =>
        /^chevrons?-(up|down|left|right)-outline-contour$/.test(el.getAttribute('data-testid')!),
      )
      .map((el) => {
        const values = el
          .querySelector('path')!
          .getAttribute('d')!
          .match(/-?\d*\.?\d+/g)!
          .map(Number);
        const points = Array.from({ length: values.length / 2 }, (_, i) => [
          values[2 * i],
          values[2 * i + 1],
        ]);
        const arms = [];
        for (let i = 0; i < points.length; i += 3)
          for (let j = 0; j < 2; j++)
            arms.push(
              Math.hypot(
                points[i + j + 1][0] - points[i + j][0],
                points[i + j + 1][1] - points[i + j][1],
              ),
            );
        return {
          double: el.getAttribute('data-testid')!.startsWith('chevrons-'),
          arms,
          center: [
            (Math.min(...points.map((p) => p[0])) + Math.max(...points.map((p) => p[0]))) / 2,
            (Math.min(...points.map((p) => p[1])) + Math.max(...points.map((p) => p[1]))) / 2,
          ],
        };
      }),
  );
  expect(geometry).toHaveLength(8);
  for (const item of geometry) {
    expect(item.arms).toHaveLength(item.double ? 4 : 2);
    for (const arm of item.arms)
      expect(arm).toBeCloseTo((item.double ? 8.25 : 9.125) * Math.SQRT2, 5);
    for (const center of item.center) expect(center).toBeCloseTo(12, 5);
  }
  if (info.project.name === 'chromium')
    await sheet.screenshot({ path: '.artifacts/previews/chevron-24.png' });
});

test('Double Chevron Filled heads touch at center without a gap or overlap', async ({ page }) => {
  for (const direction of ['up', 'down', 'left', 'right']) {
    const result = await page.evaluate((direction) => {
      const svg = document.querySelector(
        `[data-testid="chevrons-${direction}-filled-contour"] svg`,
      )!;
      const path = svg.querySelector('path')!;
      const horizontal = ['left', 'right'].includes(direction);
      return [-0.01, 0.01].every((offset) =>
        path.isPointInFill(
          new DOMPoint(12 + (horizontal ? offset : 0), 12 + (horizontal ? 0 : offset)),
        ),
      );
    }, direction);
    expect(result).toBe(true);
  }
});
