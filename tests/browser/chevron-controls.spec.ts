import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
});

test('opposed and line Chevron directions are rigid rotations with fixed physical dimensions', async ({
  page,
}) => {
  const results = await page.evaluate(() => {
    const cases: [string, string, number, number, number][] = [
      ['chevron-up-down', 'chevron-left-right', 90, 12.75, 9.75],
      ['chevron-line-up', 'chevron-line-right', 90, 8.75, 9.75],
      ['chevron-line-up', 'chevron-line-down', 180, 9.75, 8.75],
      ['chevron-line-up', 'chevron-line-left', 270, 8.75, 9.75],
    ];
    return cases.flatMap(([reference, name, degrees, width, height]) =>
      ['outline', 'filled'].map((style) => {
        const svg = (icon: string) =>
          document.querySelector(`[data-testid="${icon}-${style}-contour"] svg`)! as SVGSVGElement;
        const ref = svg(reference),
          target = svg(name);
        const ink = (node: SVGSVGElement, point: DOMPoint) =>
          [...node.querySelectorAll('path')].some((path) =>
            style === 'filled' ? path.isPointInFill(point) : path.isPointInStroke(point),
          );
        let mismatches = 0;
        const angle = (degrees * Math.PI) / 180;
        for (let x = 4.137; x < 20; x += 0.237)
          for (let y = 4.193; y < 20; y += 0.237) {
            const point = new DOMPoint(
              12 + (x - 12) * Math.cos(angle) - (y - 12) * Math.sin(angle),
              12 + (x - 12) * Math.sin(angle) + (y - 12) * Math.cos(angle),
            );
            if (ink(ref, new DOMPoint(x, y)) !== ink(target, point)) mismatches++;
          }
        const b = target.getBBox();
        return {
          name,
          style,
          mismatches,
          weight: target.getAttribute('stroke-width'),
          bounds: [b.width, b.height],
          expected: [width, height],
          center: [b.x + b.width / 2, b.y + b.height / 2],
        };
      }),
    );
  });
  for (const result of results) {
    expect(result.mismatches, `${result.name} ${result.style}`).toBeLessThanOrEqual(3);
    result.center.forEach((value) => expect(value).toBeCloseTo(12, 4));
    if (result.style === 'outline') expect(result.weight).toBe('1.75');
    else
      // Firefox/WebKit circular-arc getBBox can drift by about 0.000054 native units.
      // Keep a 0.0001-unit measurement tolerance; the membership/rotation check
      // above independently rejects an actual contour or scale mismatch.
      result.bounds.forEach((value, index) =>
        expect(Math.abs(value - result.expected[index])).toBeLessThan(0.0001),
      );
  }
});

test('solid heads retain a distinct stop-line gap and opposed heads retain their central gap', async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const shape = (name: string, style: string) =>
      document.querySelector(`[data-testid="${name}-${style}-contour"] path`)! as SVGPathElement;
    const point = (x: number, y: number) => new DOMPoint(x, y);
    const line = shape('chevron-line-up', 'filled'),
      outline = shape('chevron-line-up', 'outline'),
      pair = shape('chevron-up-down', 'filled');
    return {
      stop: line.isPointInFill(point(12, 8.5)),
      head: line.isPointInFill(point(12, 13)),
      openOutline: !outline.isPointInStroke(point(12, 13)),
      regularGap: [9.5, 10, 10.5].every(
        (y) => !line.isPointInFill(point(12, y)) && !outline.isPointInStroke(point(12, y)),
      ),
      opposedHeads: [9, 15].every((y) => pair.isPointInFill(point(12, y))),
      centralGap: [11.5, 12, 12.5].every((y) => !pair.isPointInFill(point(12, y))),
    };
  });
  Object.values(result).forEach((value) => expect(value).toBe(true));
  await page.getByLabel('Fixture arrow weight').selectOption('2.5');
  const boldGap = await page.evaluate(() => {
    const line = document.querySelector(
      '[data-testid="chevron-line-up-outline-contour"] path',
    )! as SVGPathElement;
    const pair = document.querySelector(
      '[data-testid="chevron-up-down-outline-contour"] path',
    )! as SVGPathElement;
    return (
      !line.isPointInStroke(new DOMPoint(12, 10)) &&
      [8, 12, 16].every((x) => !pair.isPointInStroke(new DOMPoint(x, 12)))
    );
  });
  expect(boldGap).toBe(true);
});

test('the six new identities render both styles at 16 20 24 and 48 pixels on light and dark', async ({
  page,
}, info) => {
  const proof = page.getByTestId('chevron-controls-proof');
  await expect(proof.locator('article')).toHaveCount(6);
  await expect(proof.locator('svg')).toHaveCount(60);
  for (const size of [16, 20, 24, 48])
    await expect(proof.locator(`svg[width="${size}"][height="${size}"]`)).toHaveCount(12);
  if (info.project.name === 'chromium') {
    await proof.screenshot({ path: '.artifacts/previews/chevron-controls-light.png' });
    await proof.evaluate((node) => {
      (node as HTMLElement).style.background = '#18181b';
      (node as HTMLElement).style.color = '#fafafa';
    });
    await proof.screenshot({ path: '.artifacts/previews/chevron-controls-dark.png' });
  }
});
