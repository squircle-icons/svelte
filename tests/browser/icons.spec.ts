import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
});

test('SSR and hydration preserve naming and multiple static instances', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/hydration|mismatch/i.test(message.text())) errors.push(message.text());
  });
  const html = await (await request.get('/')).text();
  expect(html).toContain('Camera one');
  expect(html).toContain('Unified camera');
  await page.reload();
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  await expect(page.getByRole('img', { name: 'Camera one', exact: true })).toHaveCount(1);
  await expect(page.getByRole('img', { name: 'Camera two', exact: true })).toHaveCount(1);
  await expect(page.getByTestId('instances').locator('svg[aria-hidden="true"]')).toHaveCount(3);
  await expect(page.locator('svg title, svg [id], svg[tabindex]')).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  expect(errors).toEqual([]);
});

test('unified style preserves filled artwork, defaults and accessible names', async ({ page }) => {
  const plain = page.getByTestId('unified-default').locator('svg');
  await expect(plain).toHaveAttribute('fill', 'none');
  await expect(plain).toHaveAttribute('stroke', 'currentColor');
  const camera = page.getByTestId('unified-camera').locator('svg');
  await expect(camera).toHaveAttribute('fill', 'currentColor');
  await expect(camera).toHaveAttribute('stroke', 'none');
  await expect(camera).toHaveAttribute('fill-rule', 'evenodd');
  await expect(camera).toHaveAttribute('width', '24');
  await expect(camera).toHaveClass(/custom-camera/);
  for (let index = 0; index < 5; index++) {
    const unified = await page
      .getByTestId('unified-filled-sheet')
      .locator('svg')
      .nth(index)
      .locator('path')
      .evaluateAll((paths) => paths.map((path) => path.getAttribute('d')));
    const dedicated = await page
      .getByTestId('filled-contact-sheet')
      .locator(':scope > div')
      .nth(index)
      .locator('svg')
      .first()
      .locator('path')
      .evaluateAll((paths) => paths.map((path) => path.getAttribute('d')));
    expect(unified).toEqual(dedicated);
  }
  await page.getByRole('button', { name: 'Toggle icon style' }).click();
  await expect(camera).toHaveAttribute('fill', 'none');
  await expect(camera).toHaveAttribute('stroke', 'currentColor');
  await expect(camera.locator('[data-part="lens"]')).toHaveCount(1);
  await expect(camera).toHaveAttribute('aria-label', 'Unified camera');
  await expect(page.getByTestId('unified-folder').locator('svg')).toHaveAttribute(
    'data-cutout-width',
    '1.75',
  );
  await page.getByRole('button', { name: 'Change divider width' }).click();
  await expect(page.getByTestId('unified-folder').locator('svg')).toHaveAttribute(
    'data-cutout-width',
    '2',
  );
  await expect(page.getByTestId('filled-folder').locator('svg')).toHaveAttribute(
    'data-cutout-width',
    '2',
  );
});

test('captures static outline and filled artwork', async ({ page }, info) => {
  await expect(page.getByTestId('contact-sheet')).toHaveScreenshot('contact-sheet.png');
  await expect(page.getByTestId('filled-contact-sheet')).toHaveScreenshot(
    'filled-contact-sheet.png',
  );
  if (info.project.name === 'chromium') {
    await mkdir('.artifacts/previews', { recursive: true });
    await page
      .getByTestId('contact-sheet')
      .screenshot({ path: '.artifacts/previews/contact-sheet.png' });
  }
});

test('all five available filled variants render as solid native components with deliberate counters', async ({
  page,
}) => {
  const sheet = page.getByTestId('filled-contact-sheet');
  await expect(sheet.locator('svg')).toHaveCount(20);
  for (const svg of await sheet.locator('svg').all()) {
    await expect(svg).toHaveAttribute('stroke', 'none');
    await expect(svg).toHaveAttribute('fill-rule', 'evenodd');
  }
  for (const [id, x, y] of [
    ['filled-camera', 12, 13.2],
    ['filled-settings', 12, 12],
  ] as const) {
    expect(
      await page
        .getByTestId(id)
        .locator('path')
        .first()
        .evaluate(
          (element, point) =>
            (element as SVGGeometryElement).isPointInFill(new DOMPoint(point[0], point[1])),
          [x, y],
        ),
    ).toBe(false);
  }
});

test('Filled Heart head matches the visible Regular Outline exterior', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const size = 960;
    const scale = size / 24;
    const paint = async (selector: string, outline: boolean) => {
      const original = document.querySelector(selector) as SVGSVGElement;
      const svg = original.cloneNode(true) as SVGSVGElement;
      svg.setAttribute('width', String(size));
      svg.setAttribute('height', String(size));
      // Filling the reference joins its interior and stroke into its exterior silhouette.
      svg.setAttribute('fill', '#000');
      svg.setAttribute('stroke', outline ? '#000' : 'none');
      if (outline) svg.setAttribute('stroke-width', '1.7');
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
        canvas.width = canvas.height = size;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, size, size).data;
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    const [reference, filled] = await Promise.all([
      paint('[data-testid="heart-outline-contour"] svg', true),
      paint('[data-testid="heart-filled-contour"] svg', false),
    ]);
    const firstInk = (data: Uint8ClampedArray, x: number) => {
      for (let y = 0; y < Math.floor(8.4 * scale); y++)
        if (data[(y * size + x) * 4 + 3] >= 128) return y;
      return -1;
    };
    let maximumDifference = 0,
      missingColumns = 0;
    for (let x = Math.ceil(2.5 * scale); x < Math.floor(21.5 * scale); x++) {
      const a = firstInk(reference, x),
        b = firstInk(filled, x);
      if (a < 0 || b < 0) missingColumns++;
      else maximumDifference = Math.max(maximumDifference, Math.abs(a - b));
    }
    return { maximumDifference, missingColumns };
  });
  expect(result.missingColumns).toBe(0);
  // One raster pixel at 40x is 0.025 units on the original drawing grid.
  expect(result.maximumDifference).toBeLessThanOrEqual(1);
});

for (const icon of [
  'settings',
  'bell',
  'sun',
  'moon',
  'x',
  'copy',
  'chevron-down',
  'plus',
  'check',
  'chevron-up',
])
  test(`Filled ${icon} matches the Regular Outline exterior and openings at native and rotated poses`, async ({
    page,
  }) => {
    const results = await page.evaluate(async (icon) => {
      const size = 960;
      const paint = async (outline: boolean, rotation: number) => {
        const original = document.querySelector(
          `[data-testid="${icon}-${outline ? 'outline' : 'filled'}-contour"] svg`,
        ) as SVGSVGElement;
        const svg = original.cloneNode(true) as SVGSVGElement;
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
        svg.setAttribute('fill', '#000');
        svg.setAttribute('stroke', outline ? '#000' : 'none');
        if (outline) {
          svg.setAttribute('stroke-width', '1.7');
          // Line marks keep an open interior; Filled Copy paints only its front page solid.
          if (['x', 'plus', 'check', 'chevron-down', 'chevron-up'].includes(icon))
            svg.setAttribute('fill', 'none');
          if (icon === 'copy')
            svg.querySelector('[data-part="back"]')?.setAttribute('fill', 'none');

          // The hub's white interior is the same empty space as the Filled counter.
          if (icon === 'settings') svg.querySelector('circle')?.setAttribute('fill', '#fff');
          // Filled Bell closes the open clapper into a solid part; compare its closed exterior.
          const clapper = svg.querySelector('[data-part="clapper"] path');
          if (clapper) clapper.setAttribute('d', clapper.getAttribute('d') + ' Z');
        }
        for (const group of svg.querySelectorAll(':scope > g'))
          group.setAttribute('transform', `rotate(${rotation} 12 12)`);
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
          canvas.width = canvas.height = size;
          const context = canvas.getContext('2d')!;
          context.drawImage(image, 0, 0);
          const rgba = context.getImageData(0, 0, size, size).data;
          return Uint8Array.from({ length: size * size }, (_, i) =>
            rgba[i * 4 + 3] >= 128 && rgba[i * 4] < 128 ? 1 : 0,
          );
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      const results = [];
      for (const rotation of [0, 30, 75]) {
        const [reference, filled] = await Promise.all([
          paint(true, rotation),
          paint(false, rotation),
        ]);
        let mismatches = 0,
          distantMismatches = 0;
        for (let y = 1; y < size - 1; y++)
          for (let x = 1; x < size - 1; x++) {
            const index = y * size + x;
            if (reference[index] === filled[index]) continue;
            mismatches++;
            const other = reference[index] ? filled : reference;
            let neighbor = false;
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) if (other[index + dy * size + dx]) neighbor = true;
            if (!neighbor) distantMismatches++;
          }
        results.push({ rotation, mismatches, distantMismatches });
      }
      return results;
    }, icon);
    if (icon === 'bell') {
      const solidity = await page
        .getByTestId('bell-filled-contour')
        .locator('[data-part="clapper"] path')
        .evaluate((element) => {
          const path = element as SVGPathElement;
          return {
            solid: path.isPointInFill(new DOMPoint(12, 20)),
            separated: !path.isPointInFill(new DOMPoint(12, 19)),
          };
        });
      expect(solidity).toEqual({ solid: true, separated: true });
    }
    for (const result of results) {
      // Ignore only the one-pixel antialiasing fringe at 40x magnification.
      expect(result.distantMismatches, JSON.stringify(result)).toBe(0);
      expect(result.mismatches, JSON.stringify(result)).toBeLessThan(960 * 960 * 0.002);
    }
  });

test('one icon switches styles for hover and keyboard focus without replacing its SVG', async ({
  page,
}) => {
  const button = page.getByRole('button', { name: 'Preview camera styles' });
  const svg = button.locator('svg');
  const original = await svg.elementHandle();
  await expect(svg).toHaveAttribute('fill', 'none');
  await button.hover();
  await expect(svg).toHaveAttribute('fill', 'currentColor');
  await page.mouse.move(0, 0);
  await expect(svg).toHaveAttribute('fill', 'none');
  await button.focus();
  await expect(svg).toHaveAttribute('fill', 'currentColor');
  await button.hover();
  await page.mouse.move(0, 0);
  await expect(svg).toHaveAttribute('fill', 'currentColor');
  await button.evaluate((element) => element.blur());
  await expect(svg).toHaveAttribute('fill', 'none');
  expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
});

test('named stroke presets update Outline strokes and the Filled Folder gap', async ({ page }) => {
  const svg = page.getByTestId('stroke-preset').locator('svg');
  await expect(svg).toHaveAttribute('stroke-width', '1.7');
  for (const [preset, width] of [
    ['thin', '1.25'],
    ['bold', '2.25'],
    ['regular', '1.7'],
  ]) {
    await page.getByRole('combobox', { name: 'Stroke preset' }).selectOption(preset);
    await expect(svg).toHaveAttribute('stroke-width', width);
    await expect(page.getByTestId('gap-preset').locator('svg')).toHaveAttribute(
      'data-cutout-width',
      width,
    );
  }
});

test('Round 3 exposes six packed Outline/Filled pairs on light and dark surfaces', async ({
  page,
}, info) => {
  for (const surface of ['light', 'dark']) {
    const sheet = page.getByTestId('round-three-' + surface);
    await expect(sheet.locator('article')).toHaveCount(6);
    await expect(sheet.locator('h3')).toHaveText([
      'X',
      'Copy',
      'Chevron Down',
      'Plus',
      'Check',
      'Chevron Up',
    ]);
    await expect(sheet.locator('svg')).toHaveCount(48);
    if (info.project.name === 'chromium') {
      await mkdir('.artifacts/previews', { recursive: true });
      await sheet.screenshot({ path: '.artifacts/previews/round-three-' + surface + '.png' });
    }
  }
});
