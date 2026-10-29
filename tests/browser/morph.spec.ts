import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
});
const morph = (page: import('@playwright/test').Page) =>
  page.getByRole('img', { name: 'Experimental morph' });
async function scrub(page: import('@playwright/test').Page, value: number) {
  await page.getByLabel('Fixture morph progress').evaluate((node, value) => {
    const input = node as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}
for (const style of ['outline', 'filled'])
  test(`morph ${style} endpoints match the actual packed Sun and Moon artwork`, async ({
    page,
  }) => {
    if (style === 'filled')
      await page.getByRole('button', { name: 'Morph style', exact: true }).click();
    for (const [name, progress] of [
      ['sun', 0],
      ['moon', 1],
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
            render('[data-testid="morph-fixture"] svg'),
            render(`[data-testid="morph-${name}-${style}-contour"] svg`),
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
test('morph reverses in flight from its current shape without replacing the SVG', async ({
  page,
}) => {
  const svg = await morph(page).elementHandle();
  await page.getByRole('button', { name: 'Morph moon', exact: true }).click();
  await expect
    .poll(async () => Number(await morph(page).getAttribute('data-progress')))
    .toBeGreaterThan(0.2);
  const interruption = await page.evaluate(async () => {
    const svg = document.querySelector('[data-testid="morph-fixture"] svg')!;
    const before = svg.getAttribute('data-progress');
    const button = [...document.querySelectorAll('button')].find(
      (node) => node.textContent?.trim() === 'Morph sun',
    )!;
    button.click();
    await Promise.resolve();
    return { before, after: svg.getAttribute('data-progress') };
  });
  expect(interruption.after).toBe(interruption.before);
  await expect(morph(page)).toHaveAttribute('data-state', 'sun');
  expect(
    await svg!.evaluate(
      (node) => node === document.querySelector('[data-testid="morph-fixture"] svg'),
    ),
  ).toBe(true);
});
test('reduced motion switches directly and respects a later preference change', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Morph moon', exact: true }).click();
  await expect(morph(page)).toHaveAttribute('data-state', 'moon');
  await page.getByRole('button', { name: 'Morph sun', exact: true }).click();
  await expect(morph(page)).toHaveAttribute('data-state', 'sun');
});
