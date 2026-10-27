import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
});
for (const icon of ['plus', 'minus', 'x']) {
  test(`${icon}: None Filled equals fixed Bold, framed Filled cuts out Regular`, async ({
    page,
  }) => {
    const result = await page.evaluate((icon) => {
      const svg = (style: string, frame: string) =>
        document.querySelector(
          `[data-testid="math-${icon}-${style}-${frame}"] svg`,
        )! as SVGSVGElement;
      const bold = svg('bold', 'none'),
        filled = svg('filled', 'none'),
        outline = svg('outline', 'none');
      const compare = (reference: SVGSVGElement, shape: SVGPathElement) => {
        let mismatch = 0,
          total = 0;
        const paths = [...reference.querySelectorAll('path')];
        for (let x = 5.13; x < 19; x += 0.19)
          for (let y = 5.17; y < 19; y += 0.19) {
            const p = new DOMPoint(x, y);
            if (paths.some((path) => path.isPointInStroke(p)) !== shape.isPointInFill(p))
              mismatch++;
            total++;
          }
        return mismatch / total;
      };
      const boldDifference = compare(bold, filled.querySelector('path')!);
      const frames = ['square', 'circle'].map((frame) => {
        const boxed = svg('filled', frame),
          path = boxed.querySelector('path')!,
          parts = path.getAttribute('d')!.match(/[Mm][^Mm]*/g)!;
        const hole = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hole.setAttribute('d', parts.slice(1).join(' '));
        hole.setAttribute('visibility', 'hidden');
        boxed.append(hole);
        const difference = compare(outline, hole);
        hole.remove();
        const b = path.getBBox();
        return {
          difference,
          margins: [b.x, b.y, 24 - b.x - b.width, 24 - b.y - b.height],
          glyph: svg('outline', frame)
            .querySelectorAll('path')
            [frame === 'circle' ? 0 : 1].getAttribute('d'),
        };
      });
      return {
        boldDifference,
        boldWeight: bold.getAttribute('stroke-width'),
        plainWeight: outline.getAttribute('stroke-width'),
        glyph: outline.querySelector('path')!.getAttribute('d'),
        frames,
      };
    }, icon);
    expect(result.boldWeight).toBe('2.5');
    expect(result.plainWeight).toBe('1.75');
    expect(result.boldDifference).toBeLessThan(0.002);
    for (const frame of result.frames) {
      expect(frame.difference).toBeLessThan(0.002);
      expect(frame.glyph).toBe(result.glyph);
      for (const margin of frame.margins) expect(margin).toBeCloseTo(2, 4);
    }
  });
}
test('Plus and X keep equal optical dimensions; Minus shares their width', async ({ page }) => {
  const boxes = await page.evaluate(() =>
    ['plus', 'minus', 'x'].map((icon) => {
      const svg = document.querySelector(`[data-testid="math-${icon}-outline-none"] svg`)!;
      const b = svg.querySelector('path')!.getBBox();
      return [b.width + 1.75, b.height + 1.75, b.x + b.width / 2, b.y + b.height / 2];
    }),
  );
  for (const box of boxes) {
    expect(box[0]).toBeCloseTo(10.75, 5);
    expect(box[2]).toBe(12);
    expect(box[3]).toBe(12);
  }
  expect(boxes[0][1]).toBeCloseTo(boxes[2][1], 5);
});
test('math styles render all actual sizes and a review sheet', async ({ page }, info) => {
  const sheet = page.getByTestId('math-proof');
  await expect(sheet.locator('svg')).toHaveCount(84);
  if (info.project.name === 'chromium')
    await sheet.screenshot({ path: '.artifacts/previews/math-family.png' });
});
