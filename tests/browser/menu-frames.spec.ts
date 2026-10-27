import { expect, test } from '@playwright/test';

test('Menu frames retain the shared bars, true Bold cutouts and 2px exterior margins', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  const results = await page.evaluate(() => {
    const svg = (frame: string, style: string) =>
      document.querySelector(`[data-testid="menu-frame-${frame}-${style}"] svg`)! as SVGSVGElement;
    const original = svg('none', 'outline').querySelector('path')!.getAttribute('d');
    const filled = svg('none', 'filled').querySelector('path')!;
    return ['square', 'circle'].map((frame) => {
      const outline = svg(frame, 'outline');
      const boxed = svg(frame, 'filled');
      const shape = boxed.querySelector('path')!;
      const parts = shape.getAttribute('d')!.match(/[Mm][^Mm]*/g)!;
      const hole = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hole.setAttribute('d', parts.slice(1).join(' '));
      boxed.append(hole);
      let mismatches = 0;
      for (let x = 4.13; x < 20; x += 0.17)
        for (let y = 4.19; y < 20; y += 0.17) {
          const point = new DOMPoint(x, y);
          if (hole.isPointInFill(point) !== filled.isPointInFill(point)) mismatches++;
        }
      hole.remove();
      const b = shape.getBBox();
      // At Bold, the border's nearest radial inner edge is 7.875 units from center.
      const circleBoldClearance = 7.875 - Math.hypot(5, 4) - 1.25;
      return {
        glyph: [...outline.querySelectorAll('path')].at(-1)!.getAttribute('d'),
        original,
        mismatches,
        margins: [b.x, b.y, 24 - b.x - b.width, 24 - b.y - b.height],
        circleBoldClearance,
        transparentBars: [8, 12, 16].every((y) => !shape.isPointInFill(new DOMPoint(12, y))),
        solidBetweenBars: shape.isPointInFill(new DOMPoint(12, 10)),
        fill: boxed.getAttribute('fill'),
        stroke: boxed.getAttribute('stroke'),
      };
    });
  });
  for (const result of results) {
    expect(result.glyph).toBe(result.original);
    expect(result.mismatches).toBe(0);
    result.margins.forEach((margin) => expect(margin).toBeCloseTo(2, 5));
    expect(result.circleBoldClearance).toBeGreaterThan(0.2);
    expect(result.transparentBars).toBe(true);
    expect(result.solidBetweenBars).toBe(true);
    expect(result.fill).toBe('currentColor');
    expect(result.stroke).toBe('none');
  }
});

test('Trash slots shorten equally at both ends while preserving their width and center', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  const result = await page.evaluate(() => {
    const outline = document.querySelector('[data-testid="trash-outline-contour"] svg')!;
    const slots = outline.querySelector('[data-part="slots"] path')! as SVGPathElement;
    const body = document.querySelector(
      '[data-testid="trash-filled-contour"] [data-part="body"] path',
    )! as SVGPathElement;
    const bounds = slots.getBBox();
    const check = (x: number, y: number) => ({
      stroke: slots.isPointInStroke(new DOMPoint(x, y)),
      hole: !body.isPointInFill(new DOMPoint(x, y)),
    });
    return {
      y: bounds.y,
      height: bounds.height,
      stroke: outline.getAttribute('stroke-width'),
      ends: [9.9, 14.1].flatMap((x) => [check(x, 10.1), check(x, 16.75)]),
      inside: [9.9, 14.1].flatMap((x) => [check(x, 11.1), check(x, 13.425), check(x, 15.75)]),
      sides: [check(9.9 + 0.8, 13.425), check(14.1 - 0.8, 13.425)],
      outside: [check(9.9 + 0.95, 13.425), check(14.1 - 0.95, 13.425)],
    };
  });
  expect(result.y).toBeCloseTo(11.1, 5);
  expect(result.height).toBeCloseTo(4.65, 5);
  expect(result.stroke).toBe('1.75');
  for (const point of [...result.ends, ...result.outside])
    expect(point).toEqual({ stroke: false, hole: false });
  for (const point of [...result.inside, ...result.sides])
    expect(point).toEqual({ stroke: true, hole: true });
});
