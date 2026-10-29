import { expect, test } from '@playwright/test';
import { FIGMA_STUDY_ICONS } from '../../src/lib/design/figma-catalog.js';
const groups = [...new Set(FIGMA_STUDY_ICONS.map((icon) => icon.group))];
for (const group of groups)
  test(`packed ${group} matches every literal source in both styles`, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('ready')).toHaveText('hydrated');
    const results = await page.evaluate(async (group) => {
      const raster = async (original: SVGSVGElement) => {
        const svg = original.cloneNode(true) as SVGSVGElement;
        svg.setAttribute('width', '96');
        svg.setAttribute('height', '96');
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
          canvas.width = canvas.height = 96;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          return context.getImageData(0, 0, 96, 96).data;
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      const results = [];
      for (const article of document.querySelectorAll(`[data-group="${group}"]`)) {
        const [expected, actual] = await Promise.all([
          raster(article.querySelector('[data-source] svg')!),
          raster(article.querySelector('[data-component] svg')!),
        ]);
        let mismatch = 0,
          union = 0;
        for (let i = 3; i < actual.length; i += 4) {
          const a = actual[i] >= 128,
            b = expected[i] >= 128;
          if (a || b) union++;
          if (a !== b) mismatch++;
        }
        results.push({
          name: article.getAttribute('data-icon'),
          style: article.getAttribute('data-style'),
          ratio: mismatch / union,
        });
      }
      return results;
    }, group);
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) expect(result.ratio, JSON.stringify(result)).toBeLessThan(0.001);
  });
test('all94 icons render both styles at every native size without duplicate SVG ids', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  const icons = page.getByTestId('current-collection').locator('[data-component] svg');
  await expect(icons).toHaveCount(188);
  for (const size of [16, 20, 24, 48]) {
    await page.getByRole('button', { name: `Gallery ${size}`, exact: true }).click();
    await expect
      .poll(() =>
        icons.evaluateAll(
          (nodes, size) =>
            nodes.every(
              (node) =>
                node.getAttribute('width') === String(size) &&
                node.getAttribute('height') === String(size),
            ),
          size,
        ),
      )
      .toBe(true);
  }
  expect(await icons.locator('[id]').count()).toBe(0);
});
test('style and numeric/preset weights update without replacing the accessible SVG', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  const icon = page.getByTestId('camera').locator('svg');
  await expect(icon).toHaveAttribute('stroke-width', '1.5');
  await expect(icon).toHaveAttribute('aria-label', 'Camera one');
  await expect(icon).toHaveAttribute('color', '#3155aa');
  await icon.evaluate((svg) => ((window as any).camera = svg));
  await page.getByRole('button', { name: 'Use Bold', exact: true }).click();
  await expect(icon.locator('path[stroke]').first()).toHaveAttribute('stroke-width', '2.5');
  await page.getByRole('button', { name: 'Use numeric width', exact: true }).click();
  await expect(icon.locator('path[stroke]').first()).toHaveAttribute('stroke-width', '1.25');
  await page.getByRole('button', { name: 'Toggle icon style', exact: true }).click();
  await expect(icon).not.toHaveAttribute('stroke-width');
  expect(await icon.evaluate((svg) => (window as any).camera === svg)).toBe(true);
  await expect(page.getByTestId('decorative').locator('svg[aria-hidden="true"]')).toHaveCount(2);
});
