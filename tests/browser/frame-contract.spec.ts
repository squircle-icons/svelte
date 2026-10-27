import { expect, test } from '@playwright/test';

test('Square frames use the owner-requested radius6 exterior with unchanged2px bounds', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  await page.getByLabel('Fixture arrow frame').selectOption('square');
  const results = await page.evaluate(() => {
    const ids = [
      'arrow-up-filled-contour',
      'chevron-up-filled-contour',
      'chevron-up-down-filled-contour',
      'chevron-line-up-filled-contour',
      'menu-frame-square-filled',
      'check-frame-square-filled',
      'math-plus-filled-square',
      'math-x-filled-square',
    ];
    return ids.map((id) => {
      const svg = document.querySelector(`[data-testid="${id}"] svg`)! as SVGSVGElement;
      const path = svg.querySelector('path')!;
      const b = path.getBBox();
      return {
        id,
        margins: [b.x, b.y, 24 - b.x - b.width, 24 - b.y - b.height],
        moreRounded: !path.isPointInFill(new DOMPoint(3, 4.5)),
        nearbyBorder: path.isPointInFill(new DOMPoint(3.4, 4.5)),
        straightSide: path.isPointInFill(new DOMPoint(2.5, 12)),
      };
    });
  });
  for (const result of results) {
    result.margins.forEach((value) => expect(value, result.id).toBeCloseTo(2, 4));
    expect(result.moreRounded, result.id).toBe(true);
    expect(result.nearbyBorder, result.id).toBe(true);
    expect(result.straightSide, result.id).toBe(true);
  }
});

test('natural unframed icons expose their own artwork without a runtime frame attribute', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  for (const name of ['maximize', 'minimize', 'external-link'])
    for (const style of ['outline', 'filled']) {
      const svg = page.getByTestId(`unframed-${name}-${style}`).locator('svg');
      await expect(svg).toHaveCount(1);
      expect(await svg.getAttribute('frame')).toBeNull();
      await expect(svg).toHaveAttribute('data-frame', 'none');
    }
});
