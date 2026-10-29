import { registerMorphLifecycle } from './morph-lifecycle.js';
import { expect, test } from '@playwright/test';
test('packed Menu X retains its SVG on reversal and supports manual Filled inspection', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const svg = page.getByRole('img', { name: 'Menu X fixture' });
  await expect(svg).toHaveAttribute('data-state', 'menu');
  const original = await svg.elementHandle();
  await page.getByRole('button', { name: 'Menu X open', exact: true }).click();
  await expect
    .poll(async () => Number(await svg.getAttribute('data-progress')))
    .toBeGreaterThan(0.2);
  const reversal = await page.evaluate(async () => {
    const svg = document.querySelector('[aria-label="Menu X fixture"]')!;
    const before = svg.getAttribute('data-progress');
    [...document.querySelectorAll('button')].find((b) => b.textContent === 'Menu X close')!.click();
    await Promise.resolve();
    return [before, svg.getAttribute('data-progress')];
  });
  expect(reversal[0]).toBe(reversal[1]);
  await expect(svg).toHaveAttribute('data-state', 'menu');
  expect(
    await original!.evaluate((n) => n === document.querySelector('[aria-label="Menu X fixture"]')),
  ).toBe(true);
  for (const p of [0, 0.001, 0.25, 0.5, 0.65, 0.9, 0.999, 1]) {
    await page.getByRole('slider', { name: 'Fixture Menu X progress' }).evaluate((n, p) => {
      (n as HTMLInputElement).value = String(p);
      n.dispatchEvent(new Event('input', { bubbles: true }));
    }, p);
    await expect(svg).toHaveAttribute('data-progress', p.toFixed(5));
    const filled = page.getByTestId('menu-x-morph-fixture').locator('svg').last();
    expect(await filled.locator('path').getAttribute('d')).not.toMatch(/NaN|Infinity/);
  }
  expect(errors).toEqual([]);
});
test('Menu X switches instantly with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const svg = page.getByRole('img', { name: 'Menu X fixture' });
  await page.getByRole('button', { name: 'Menu X open', exact: true }).click();
  await expect(svg).toHaveAttribute('data-state', 'x');
  await page.getByRole('button', { name: 'Menu X close', exact: true }).click();
  await expect(svg).toHaveAttribute('data-state', 'menu');
});

for (const style of ['outline', 'filled'])
  test(`Menu X morph ${style} endpoints match the actual packed Menu and X artwork`, async ({
    page,
  }) => {
    await page.goto('/');
    for (const [name, progress] of [
      ['menu', 0],
      ['x', 1],
    ] as const) {
      await page.getByLabel('Fixture Menu X progress').evaluate((node, value) => {
        (node as HTMLInputElement).value = String(value);
        node.dispatchEvent(new Event('input', { bubbles: true }));
      }, progress);
      await expect(page.getByRole('img', { name: 'Menu X fixture' })).toHaveAttribute(
        'data-state',
        name,
      );
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
            render(
              style === 'filled'
                ? '[data-testid="menu-x-intermediate-filled"] svg'
                : '[aria-label="Menu X fixture"]',
            ),
            render(
              name === 'menu' && style === 'filled'
                ? '[data-testid="morph-menu-filled-contour"] svg'
                : `[data-testid="morph-${name}-${style}-contour"] svg`,
            ),
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

registerMorphLifecycle('Menu X fixture', 'Menu X open', 'x');

for (const frame of ['none'])
  test(`Menu X ${frame} merges horizontally before opening the diagonals`, async ({ page }) => {
    await page.goto('/');
    const svg = page.getByTestId('menu-x-intermediate-outline').locator('svg');
    const body = svg.locator('[data-part="body"]');
    const scrub = (p: number) =>
      page.getByLabel('Fixture Menu X progress').evaluate((node, value) => {
        (node as HTMLInputElement).value = String(value);
        node.dispatchEvent(new Event('input', { bubbles: true }));
      }, p);
    await scrub(0.4);
    const before = (await body.getAttribute('d'))!.match(/-?\d*\.?\d+/g)!.map(Number);
    expect(before[1]).toBe(before[3]);
    expect(before[5]).toBe(before[7]);
    expect(before[1]).toBeLessThan(before[5]);
    await scrub(0.5);
    expect((await body.getAttribute('d'))!.match(/M/g)).toHaveLength(1);
    expect(await body.evaluate((node) => (node as SVGPathElement).getBBox().height)).toBe(0);
    await expect(svg.locator('[data-part="middle"]')).toHaveCount(0);
    const filled = page.getByTestId('menu-x-intermediate-filled').locator('svg');
    const centerIsInk = await filled
      .locator('path')
      .evaluate((node) => (node as SVGPathElement).isPointInFill(new DOMPoint(12, 12)));
    expect(centerIsInk).toBe(frame === 'none');
    await scrub(0.6);
    const after = (await body.getAttribute('d'))!.match(/-?\d*\.?\d+/g)!.map(Number);
    expect(after[1]).toBeLessThan(after[3]);
    expect(after[5]).toBeGreaterThan(after[7]);
  });
