import { expect, test } from '@playwright/test';

test('Copy mirrors the old artwork retained as New Window, with foreground on the opposite side', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  const results = await page.evaluate(() =>
    ['outline', 'filled'].map((style) => {
      const svg = (name: string) =>
        document.querySelector(`[data-testid="${name}-${style}-contour"] svg`)! as SVGSVGElement;
      const copy = svg('copy'),
        window = svg('new-window');
      const ink = (node: SVGSVGElement, p: DOMPoint) =>
        [...node.querySelectorAll('path')].some((path) =>
          style === 'outline' ? path.isPointInStroke(p) : path.isPointInFill(p),
        );
      let mismatches = 0;
      for (let x = 1.137; x < 23; x += 0.173)
        for (let y = 1.193; y < 23; y += 0.173)
          if (ink(copy, new DOMPoint(x, y)) !== ink(window, new DOMPoint(24 - x, y))) mismatches++;
      const bounds = (node: SVGSVGElement, part: string) =>
        (node.querySelector(`[data-part="${part}"] path`)! as SVGPathElement).getBBox();
      const copyFront = bounds(copy, 'front'),
        copyBack = bounds(copy, 'back'),
        windowFront = bounds(window, 'front'),
        windowBack = bounds(window, 'back');
      return {
        style,
        mismatches,
        copyLeft: copyFront.x < copyBack.x,
        windowRight: windowFront.x > windowBack.x,
        sameHeight: Math.abs(copyFront.y - windowFront.y) < 1e-5,
        namedParts: [...copy.querySelectorAll('[data-part]')].map((part) =>
          part.getAttribute('data-part'),
        ),
      };
    }),
  );
  for (const result of results) {
    expect(result.mismatches, result.style).toBeLessThanOrEqual(3);
    expect(result.copyLeft).toBe(true);
    expect(result.windowRight).toBe(true);
    expect(result.sameHeight).toBe(true);
    expect(result.namedParts).toEqual(['back', 'front']);
  }
  const proof = page.getByTestId('copy-window-proof');
  await expect(proof.locator('svg')).toHaveCount(20);
  for (const size of [16, 20, 24, 48])
    await expect(proof.locator(`svg[width="${size}"][height="${size}"]`)).toHaveCount(4);
});
