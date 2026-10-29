import { expect, test } from '@playwright/test';
for (const style of ['outline', 'filled'])
  test(`Trash closed ${style} matches literal packed source without a seam`, async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('ready')).toHaveText('hydrated');
    if (style === 'filled')
      await page.getByRole('button', { name: 'Trash style', exact: true }).click();
    const difference = await page.evaluate(async () => {
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
        render('[data-testid="trash-motion-fixture"] svg'),
        render('[data-testid="trash-static-contour"] svg'),
      ]);
      let mismatch = 0,
        union = 0;
      for (let i = 3; i < a.length; i += 4) {
        const x = a[i] >= 128,
          y = b[i] >= 128;
        if (x || y) union++;
        if (x !== y) mismatch++;
      }
      let interiorCracks = 0;
      for (let y = 1; y < 479; y++)
        for (let x = 1; x < 479; x++) {
          const index = (y * 480 + x) * 4 + 3;
          const neighbors = [-481, -480, -479, -1, 0, 1, 479, 480, 481];
          if (neighbors.every((offset) => b[index + offset * 4] === 255) && a[index] < 250)
            interiorCracks++;
        }
      return { contourDifference: mismatch / union, interiorCracks };
    });
    // WebKit rasterizes equivalent reversed cubic counters slightly differently.
    // Bound edge-only differences separately from cracks in the opaque interior.
    expect(difference.contourDifference).toBeLessThan(0.001);
    expect(difference.interiorCracks).toBe(0);
  });
