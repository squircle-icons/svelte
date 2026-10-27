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

test('unapproved frame props do not add frames to Maximize or External Link', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  const results = await page.evaluate(() =>
    ['maximize', 'minimize', 'external-link'].flatMap((name) =>
      ['outline', 'filled'].map((style) => {
        const svg = (frame: string) =>
          document.querySelector(`[data-testid="unframed-${name}-${style}-${frame}"] svg`)!;
        const geometry = (frame: string) =>
          [...svg(frame).querySelectorAll('path,circle')].map((shape) => shape.outerHTML);
        const original = geometry('none');
        return {
          name,
          style,
          original,
          requested: ['square', 'circle'].map((frame) => ({
            geometry: geometry(frame),
            dataFrame: svg(frame).getAttribute('data-frame'),
            frameAttr: svg(frame).getAttribute('frame'),
          })),
        };
      }),
    ),
  );
  for (const result of results)
    for (const requested of result.requested) {
      expect(requested.geometry, `${result.name} ${result.style}`).toEqual(result.original);
      expect(requested.dataFrame).toBeNull();
      expect(requested.frameAttr).toBeNull();
    }
});
