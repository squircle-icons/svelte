import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
});
const morph = (page: import('@playwright/test').Page) =>
  page.getByRole('img', { name: 'Experimental Plus X morph' });
async function scrub(page: import('@playwright/test').Page, value: number) {
  await page.getByLabel('Fixture Plus X progress').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}
for (const style of ['outline', 'filled'])
  test(`Plus X morph ${style} endpoints match the actual packed Plus and X artwork`, async ({
    page,
  }) => {
    if (style === 'filled')
      await page.getByRole('button', { name: 'Plus X style', exact: true }).click();
    for (const [name, progress] of [
      ['plus', 0],
      ['x', 1],
    ] as const) {
      await scrub(page, progress);
      await expect(morph(page)).toHaveAttribute('data-state', name);
      const difference = await page.evaluate(
        async ({ name, style }) => {
          const render = async (selector: string) => {
            const svg = document.querySelector(selector)!.cloneNode(true) as SVGSVGElement;
            svg.setAttribute('width', '480');
            svg.setAttribute('height', '480');
            svg.setAttribute('color', '#000');
            const url = URL.createObjectURL(
              new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }),
            );
            try {
              const image = new Image();
              await new Promise<void>((resolve, reject) => {
                image.onload = () => resolve();
                image.onerror = reject;
                image.src = url;
              });
              const canvas = document.createElement('canvas');
              canvas.width = canvas.height = 480;
              const context = canvas.getContext('2d')!;
              context.drawImage(image, 0, 0);
              return context.getImageData(0, 0, 480, 480).data;
            } finally {
              URL.revokeObjectURL(url);
            }
          };
          const [a, b] = await Promise.all([
            render('[data-testid="plus-x-morph-fixture"] svg'),
            render(`[data-testid="${name}-${style}-contour"] svg`),
          ]);
          let mismatch = 0,
            union = 0;
          for (let i = 3; i < a.length; i += 4) {
            const x = a[i] >= 128,
              y = b[i] >= 128;
            if (x || y) union++;
            if (x !== y) mismatch++;
          }
          return mismatch / union;
        },
        { name, style },
      );
      expect(difference).toBeLessThan(0.006);
    }
  });
test('Plus X morph reverses in flight from its current shape without replacing the SVG', async ({
  page,
}) => {
  const svg = await morph(page).elementHandle();
  await page.getByRole('button', { name: 'Morph x', exact: true }).click();
  await expect
    .poll(async () => Number(await morph(page).getAttribute('data-progress')))
    .toBeGreaterThan(0.2);
  const interruption = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="plus-x-morph-fixture"] svg')!;
    const before = svg.getAttribute('data-progress');
    const button = [...document.querySelectorAll('button')].find(
      (node) => node.textContent?.trim() === 'Morph plus',
    )!;
    button.click();
    await Promise.resolve();
    return { before, after: svg.getAttribute('data-progress') };
  });
  expect(interruption.after).toBe(interruption.before);
  await expect(morph(page)).toHaveAttribute('data-state', 'plus');
  expect(
    await svg!.evaluate(
      (node) => node === document.querySelector('[data-testid="plus-x-morph-fixture"] svg'),
    ),
  ).toBe(true);
});
test('default pace leaves time to read the merge before X opens', async ({ page }) => {
  const progress = await page.evaluate(async () => {
    const button = [...document.querySelectorAll('button')].find(
      (node) => node.textContent?.trim() === 'Morph x',
    )!;
    const start = performance.now();
    button.click();
    return new Promise<number>((resolve) => {
      const sample = () => {
        if (performance.now() - start < 400) requestAnimationFrame(sample);
        else
          resolve(
            Number(
              document
                .querySelector('[data-testid="plus-x-morph-fixture"] svg')!
                .getAttribute('data-progress'),
            ),
          );
      };
      requestAnimationFrame(sample);
    });
  });
  expect(progress).toBeGreaterThan(0.1);
  expect(progress).toBeLessThan(0.75);
  await expect(morph(page)).toHaveAttribute('data-state', 'x');
});
test('reduced motion switches directly and respects a later preference change', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Morph x', exact: true }).click();
  await expect(morph(page)).toHaveAttribute('data-state', 'x');
  await page.getByRole('button', { name: 'Morph plus', exact: true }).click();
  await expect(morph(page)).toHaveAttribute('data-state', 'plus');
});

test('the fixed Filled box cuts out the exact moving Outline at intermediate frames', async ({
  page,
}) => {
  for (const progress of [0.1, 0.25, 0.4, 0.49, 0.499, 0.5, 0.501, 0.51, 0.6, 0.75, 0.9]) {
    await scrub(page, progress);
    await expect(morph(page)).toHaveAttribute('data-progress', progress.toFixed(5));
    const result = await page.evaluate(() => {
      const outline = document.querySelector(
        '[data-testid="plus-x-intermediate-outline"] path',
      ) as SVGPathElement;
      const filled = document.querySelector(
        '[data-testid="plus-x-intermediate-filled"] path',
      ) as SVGPathElement;
      let mismatches = 0;
      for (let y = 4.1; y < 20; y += 0.2)
        for (let x = 4.1; x < 20; x += 0.2) {
          const point = new DOMPoint(x, y);
          if (outline.isPointInStroke(point) === filled.isPointInFill(point)) mismatches++;
        }
      const box = outline.getBBox();
      return {
        mismatches,
        bounds: [box.x, box.y, box.width, box.height],
        boxPath: filled.getAttribute('d')!.split(' Z')[0],
        stroke: outline.ownerSVGElement!.getAttribute('stroke-width'),
      };
    });
    expect(result.mismatches).toBeLessThanOrEqual(4);
    expect(result.stroke).toBe('1.75');
    expect(result.bounds[0]).toBeCloseTo(7.5, 5);
    expect(result.bounds[2]).toBeCloseTo(9, 5);
    expect(result.bounds[1]).toBeGreaterThanOrEqual(7.5 - 1e-6);
    expect(result.bounds[1] + result.bounds[3]).toBeLessThanOrEqual(16.5 + 1e-6);
    if (progress === 0.5) expect(result.bounds[3]).toBeCloseTo(0, 5);
    expect(result.boxPath).toBe(
      'M6 2 H18 A4 4 0 0 1 22 6 V18 A4 4 0 0 1 18 22 H6 A4 4 0 0 1 2 18 V6 A4 4 0 0 1 6 2',
    );
  }
});
