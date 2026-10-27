import { expect, test } from '@playwright/test';

test('Check None Filled follows Bold and both frames retain that exact transparent mark', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  const results = await page.evaluate(() => {
    const svg = (frame: string, style: string) =>
      document.querySelector(`[data-testid="check-frame-${frame}-${style}"] svg`)! as SVGSVGElement;
    const outline = svg('none', 'outline'),
      filled = svg('none', 'filled');
    const original = outline.querySelector('path')!.getAttribute('d');
    const paths = [...filled.querySelectorAll('path')];
    const ink = (point: DOMPoint) => paths.some((path) => path.isPointInFill(point));
    const framed = ['square', 'circle'].map((frame) => {
      const boxed = svg(frame, 'filled'),
        path = boxed.querySelector('path')!;
      const parts = path.getAttribute('d')!.match(/[Mm][^Mm]*/g)!;
      const hole = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hole.setAttribute('d', parts.slice(1).join(' '));
      boxed.append(hole);
      let mismatches = 0;
      for (let x = 3.137; x < 21; x += 0.157)
        for (let y = 3.193; y < 21; y += 0.157) {
          const point = new DOMPoint(x, y);
          if (hole.isPointInFill(point) !== ink(point)) mismatches++;
        }
      hole.remove();
      const b = path.getBBox();
      return {
        mismatches,
        glyph: [...svg(frame, 'outline').querySelectorAll('path')].at(-1)!.getAttribute('d'),
        original,
        margins: [b.x, b.y, 24 - b.x - b.width, 24 - b.y - b.height],
        border: path.isPointInFill(new DOMPoint(3, 12)),
        stroke: boxed.getAttribute('stroke'),
        fillRule: boxed.getAttribute('fill-rule'),
      };
    });
    return {
      framed,
      standaloneWeight: outline.getAttribute('stroke-width'),
      standaloneStroke: filled.getAttribute('stroke'),
      noStandaloneBox: !ink(new DOMPoint(3, 12)),
    };
  });
  expect(results.standaloneWeight).toBe('1.75');
  expect(results.standaloneStroke).toBe('none');
  expect(results.noStandaloneBox).toBe(true);
  for (const frame of results.framed) {
    expect(frame.mismatches).toBe(0);
    expect(frame.glyph).toBe(frame.original);
    frame.margins.forEach((margin) => expect(margin).toBeCloseTo(2, 4));
    expect(frame.border).toBe(true);
    expect(frame.stroke).toBe('none');
    expect(frame.fillRule).toBe('evenodd');
  }
  await page.getByLabel('Fixture arrow weight').selectOption('2.5');
  const clearance = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="check-frame-circle-outline"] svg')!;
    const values = [...svg.querySelectorAll('path')]
      .at(-1)!
      .getAttribute('d')!
      .match(/-?\d*\.?\d+/g)!
      .map(Number);
    const vertexClearance = values
      .filter((_, i) => i % 2 === 0)
      .map((x, i) => 7.875 - Math.hypot(x - 12, values[i * 2 + 1] - 12) - 1.25);
    return Math.min(...vertexClearance);
  });
  expect(clearance).toBeGreaterThan(0);
});
