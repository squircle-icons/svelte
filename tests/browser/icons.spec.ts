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
  'camera',
  'folder',
  'settings',
  'bell',
  'sun',
  'moon',
  'x',
  'copy',
  'search',
  'chevron-down',
  'plus',
  'check',
  'chevron-up',
  'arrow-left',
  'arrow-right',
  'menu',
  'download',
  'upload',
  'trash',
])
  test(`Filled ${icon} preserves ${['menu', 'search'].includes(icon) ? 'Bold' : 'Regular'} Outline reference contours and openings at native and rotated poses`, async ({
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
        if (!outline && ['plus', 'x', 'check'].includes(icon)) {
          // Owner-requested Filled boxes are a deliberate exterior exception.
          // The negative-space glyph matches the unchanged Outline exterior for both marks.
          const path = svg.querySelector('path')!;
          const parts = path.getAttribute('d')!.match(/[Mm][^Mm]*/g)!;
          if (parts.length !== 2) throw new Error('Expected a box and glyph cutout subpaths');
          path.setAttribute('d', parts.slice(1).join(' '));
        }

        if (['camera', 'folder'].includes(icon)) {
          for (const group of svg.querySelectorAll(':scope > g'))
            if (group.getAttribute('data-part') !== 'body') group.remove();
          if (!outline) {
            const path = svg.querySelector('path')!;
            path.setAttribute('d', path.getAttribute('d')!.match(/[Mm][^Mm]*/g)![0]);
          }
        }
        if (outline) {
          svg.setAttribute('stroke-width', ['menu', 'search'].includes(icon) ? '2.25' : '1.7');
          // Line marks keep an open interior; Filled Copy paints only its front page solid.
          if (
            [
              'x',
              'plus',
              'search',
              'check',
              'chevron-down',
              'chevron-up',
              'arrow-left',
              'arrow-right',
              'menu',
              'download',
              'upload',
              'trash',
            ].includes(icon)
          )
            svg.setAttribute('fill', 'none');
          if (
            [
              'arrow-left',
              'arrow-right',
              'chevron-down',
              'chevron-up',
              'download',
              'upload',
            ].includes(icon)
          ) {
            const group = ['download', 'upload'].includes(icon) ? 'arrow' : 'body';
            const head = svg.querySelector(`[data-part="${group}"] path`)!;
            head.setAttribute('d', head.getAttribute('d') + ' Z');
            head.setAttribute('fill', '#000');
          }
          if (icon === 'trash') {
            svg.querySelector('[data-part="body"]')?.setAttribute('fill', '#000');
            svg.querySelector('[data-part="slots"]')?.setAttribute('stroke', '#fff');
          }
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

test('X shares identical Outline and Filled glyphs inside a box with 2px outer margins', async ({
  page,
}, info) => {
  const result = await page.evaluate(async () => {
    const size = 960;
    const paint = async (name: 'plus' | 'x', style: 'outline' | 'filled', angle: number) => {
      const sourceStyle = name === 'plus' ? 'outline' : style;
      const outline = sourceStyle === 'outline';
      const armScale = name === 'plus' ? Math.SQRT2 : 1;
      const original = document.querySelector(
        `[data-testid="${name}-${sourceStyle}-contour"] svg`,
      ) as SVGSVGElement;
      const svg = original.cloneNode(true) as SVGSVGElement;
      svg.setAttribute('width', String(size));
      svg.setAttribute('height', String(size));
      svg.setAttribute('fill', outline ? 'none' : '#000');
      svg.setAttribute('stroke', outline ? '#000' : 'none');
      if (outline) svg.setAttribute('stroke-width', String(1.7 / armScale));
      else {
        const path = svg.querySelector('path')!;
        const parts = path.getAttribute('d')!.match(/[Mm][^Mm]*/g)!;
        if (parts.length !== 2) throw new Error('Expected a box and a glyph cutout');
        path.setAttribute('d', parts[1]);
      }

      for (const group of svg.querySelectorAll(':scope > g'))
        group.setAttribute(
          'transform',
          `rotate(${angle} 12 12) translate(12 12) scale(${armScale}) translate(-12 -12)`,
        );
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
        const pixels = context.getImageData(0, 0, size, size).data;
        return Uint8Array.from({ length: size * size }, (_, i) =>
          pixels[i * 4 + 3] >= 128 ? 1 : 0,
        );
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    const lengths = ['plus', 'x'].map((name) =>
      (
        document.querySelector(`[data-testid="${name}-outline-contour"] path`) as SVGPathElement
      ).getTotalLength(),
    );
    const poses = [];
    for (const style of ['outline', 'filled'] as const) {
      for (const rotation of [0, 30, 75]) {
        const [plus, x] = await Promise.all([
          paint('plus', style, rotation + 45),
          paint('x', style, rotation),
        ]);
        let mismatches = 0,
          distantMismatches = 0;
        for (let y = 1; y < size - 1; y++)
          for (let column = 1; column < size - 1; column++) {
            const index = y * size + column;
            if (plus[index] === x[index]) continue;
            mismatches++;
            const other = plus[index] ? x : plus;
            let neighbor = false;
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) if (other[index + dy * size + dx]) neighbor = true;
            if (!neighbor) distantMismatches++;
          }
        poses.push({ style, rotation, mismatches, distantMismatches });
      }
    }
    return {
      lengths,
      poses,
      xStroke: document
        .querySelector('[data-testid="x-outline-contour"] svg')!
        .getAttribute('stroke-width'),
    };
  });
  expect(result.lengths[0]).toBeCloseTo(28.6, 4);
  expect(result.lengths[1]).toBeCloseTo(28.6 * Math.SQRT2, 4);
  expect(result.xStroke).toBe('1.7');
  for (const pose of result.poses) {
    expect(pose.distantMismatches, JSON.stringify(pose)).toBe(0);
    expect(pose.mismatches, JSON.stringify(pose)).toBeLessThan(960 * 960 * 0.002);
  }
  if (info.project.name === 'chromium') {
    await mkdir('.artifacts/previews', { recursive: true });
    await page
      .getByTestId('plus-x-rotation-sheet')
      .screenshot({ path: '.artifacts/previews/plus-x-boxes.png' });
  }
});

test('Round 4 exposes six draft pairs on light and dark review sheets', async ({ page }, info) => {
  for (const surface of ['light', 'dark']) {
    const sheet = page.getByTestId('round-four-' + surface);
    await expect(sheet.locator('article')).toHaveCount(6);
    await expect(sheet.locator('svg')).toHaveCount(48);
    if (info.project.name === 'chromium') {
      await mkdir('.artifacts/previews', { recursive: true });
      await sheet.screenshot({ path: '.artifacts/previews/round-four-' + surface + '.png' });
    }
  }
});

for (const icon of ['plus', 'x', 'check'])
  test(`Filled ${icon} has a rounded box with 2px primary clearance around its glyph cutout`, async ({
    page,
  }) => {
    const result = await page.evaluate((icon) => {
      const filled = document.querySelector(
        `[data-testid="${icon}-filled-contour"] path`,
      ) as SVGPathElement;
      const cutout = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const parts = filled.getAttribute('d')!.match(/[Mm][^Mm]*/g)!;
      if (parts.length !== 2) throw new Error('Expected a box and a cutout');
      cutout.setAttribute('d', parts[1]);
      filled.parentNode!.appendChild(cutout);
      const glyph = cutout.getBBox(),
        box = filled.getBBox();
      cutout.remove();
      return {
        outerMargins: [box.x, box.y, 24 - box.x - box.width, 24 - box.y - box.height],
        glyphMargins: [glyph.x, glyph.y, 24 - glyph.x - glyph.width, 24 - glyph.y - glyph.height],
        padding: [
          glyph.x - box.x,
          box.x + box.width - glyph.x - glyph.width,
          glyph.y - box.y,
          box.y + box.height - glyph.y - glyph.height,
        ],
        emptyCenter: !filled.isPointInFill(
          new DOMPoint(icon === 'check' ? 9.25 : 12, icon === 'check' ? 16.95 : 12),
        ),
        solidBorder: filled.isPointInFill(new DOMPoint(box.x + 0.75, 12)),
        clearOutside: !filled.isPointInFill(new DOMPoint(box.x - 0.25, 12)),
        roundedCorner: !filled.isPointInFill(new DOMPoint(box.x + 0.1, box.y + 0.1)),
        rounderCorner: !filled.isPointInFill(new DOMPoint(box.x + 0.9, box.y + 0.9)),
      };
    }, icon);
    // Chromium and WebKit approximate circular-arc bounds by up to 0.0003 native units.
    // The rotated contour tests independently check the unchanged 1.70 glyph weight.
    for (const [index, padding] of result.padding.entries())
      expect(padding).toBeCloseTo(icon === 'check' && index >= 2 ? 4.2 : 2, 3);
    if (['x', 'plus'].includes(icon)) {
      for (const margin of result.outerMargins) expect(margin).toBeCloseTo(2, 5);
      for (const margin of result.glyphMargins) expect(margin).toBeCloseTo(4, 3);
    }
    expect(result.emptyCenter).toBe(true);
    expect(result.solidBorder).toBe(true);
    expect(result.clearOutside).toBe(true);
    expect(result.roundedCorner).toBe(true);
    expect(result.rounderCorner).toBe(true);
  });

test('X Outline matches the inner Filled glyph with unchanged stroke and 4px artboard spacing', async ({
  page,
}) => {
  const result = await page
    .getByTestId('x-outline-contour')
    .locator('svg')
    .evaluate((element) => {
      const svg = element as SVGSVGElement;
      const box = (svg.querySelector('path') as SVGPathElement).getBBox();
      const stroke = Number(svg.getAttribute('stroke-width'));
      return {
        stroke,
        margins: [
          box.x - stroke / 2,
          box.y - stroke / 2,
          24 - box.x - box.width - stroke / 2,
          24 - box.y - box.height - stroke / 2,
        ],
        cap: svg.getAttribute('stroke-linecap'),
      };
    });
  expect(result.stroke).toBe(1.7);
  expect(result.cap).toBe('round');
  for (const margin of result.margins) expect(margin).toBeCloseTo(4, 5);
});

test('unboxed Camera and Folder retain horizontal proportions with a 2px primary pair', async ({
  page,
}, info) => {
  for (const icon of ['camera', 'folder'])
    for (const style of ['outline', 'filled']) {
      const box = await page
        .getByTestId(`${icon}-${style}-contour`)
        .locator('svg')
        .evaluate((el, style) => {
          const path = el.querySelector('[data-part="body"] path') as SVGPathElement;
          const b = path.getBBox();
          const half = style === 'outline' ? 0.85 : 0;
          return {
            left: b.x - half,
            right: 24 - b.x - b.width - half,
            width: b.width + 2 * half,
            height: b.height + 2 * half,
          };
        }, style);
      expect(box.left).toBeCloseTo(2, 5);
      expect(box.right).toBeCloseTo(2, 5);
      expect(box.width).toBeGreaterThan(box.height);
    }
  if (info.project.name === 'chromium')
    await page
      .getByTestId('primary-rounded-sheet')
      .screenshot({ path: '.artifacts/previews/camera-folder-rounded.png' });
});

test('Copy has 1px junction breaks, 4px inter-page spacing and standard corners', async ({
  page,
}, info) => {
  const result = await page.evaluate(() => {
    const outline = document.querySelector(
      '[data-testid="copy-outline-contour"] svg',
    ) as SVGSVGElement;
    const backPath = outline.querySelector('[data-part="back"] path') as SVGPathElement;
    const back = backPath.getBBox();
    const start = backPath.getPointAtLength(0);
    const end = backPath.getPointAtLength(backPath.getTotalLength());
    const front = (outline.querySelector('[data-part="front"] path') as SVGPathElement).getBBox();
    const filled = document.querySelector(
      '[data-testid="copy-filled-contour"] svg',
    ) as SVGSVGElement;
    const frontFill = filled.querySelector('[data-part="front"] path') as SVGPathElement;
    const b = frontFill.getBBox();
    const f = filled.getBBox();
    const h = Number(outline.getAttribute('stroke-width')) / 2;
    return {
      gaps: [front.x - back.x - 2 * h, front.y - back.y - 2 * h],
      junctionGaps: [front.x - start.x - 2 * h, front.y - end.y - 2 * h],
      margins: [f.x, f.y, 24 - f.x - f.width, 24 - f.y - f.height],
      stroke: h * 2,
      roundedCorner: !frontFill.isPointInFill(new DOMPoint(b.x + 0.9, b.y + 0.9)),
      solidFront: frontFill.isPointInFill(new DOMPoint(14, 14)),
    };
  });
  for (const gap of result.gaps) expect(gap).toBeCloseTo(4, 4);
  for (const gap of result.junctionGaps) expect(gap).toBeCloseTo(1, 4);
  for (const margin of result.margins) expect(margin).toBeCloseTo(2, 4);
  expect(result.stroke).toBe(1.7);
  expect(result.roundedCorner).toBe(true);
  expect(result.solidFront).toBe(true);
  if (info.project.name === 'chromium')
    await page
      .getByTestId('copy-review-sheet')
      .screenshot({ path: '.artifacts/previews/copy-spaced-rounded.png' });
});

for (const icon of ['menu', 'search'])
  test(`Filled ${icon} uses Bold without a box and retains 2px primary margins`, async ({
    page,
  }, info) => {
    const values = await page.evaluate((icon) => {
      const svg = document.querySelector(
        `[data-testid="${icon}-filled-contour"] svg`,
      ) as SVGSVGElement;
      const box = svg.getBBox();
      const ink = (x: number, y: number) =>
        Array.from(svg.querySelectorAll('path')).some((p) => p.isPointInFill(new DOMPoint(x, y)));
      return {
        margins: [box.x, 24 - box.x - box.width, box.y, 24 - box.y - box.height],
        emptyCorner: !ink(3, 3),
        emptyCenter: !ink(icon === 'search' ? 9.95977012 : 12, icon === 'search' ? 9.95977012 : 9),
        boldInk: icon === 'menu' ? ink(12, 6.95) : ink(3.125, 9.95977012),
      };
    }, icon);
    for (const margin of values.margins.slice(0, icon === 'search' ? 4 : 2))
      expect(margin).toBeCloseTo(2, 3);
    expect(values.emptyCorner).toBe(true);
    expect(values.emptyCenter).toBe(true);
    expect(values.boldInk).toBe(true);
    if (icon === 'search' && info.project.name === 'chromium')
      await page
        .getByTestId('search-bold-sheet')
        .screenshot({ path: '.artifacts/previews/search-bold.png' });
  });

test('Trash bakes the accepted 105 by 95 proportions into native geometry with fixed stroke', async ({
  page,
}) => {
  const values = await page.evaluate(() => {
    const outline = document.querySelector(
      '[data-testid="trash-outline-contour"] svg',
    ) as SVGSVGElement;
    const body = outline.querySelector('[data-part="body"] path') as SVGPathElement;
    const filled = document.querySelector(
      '[data-testid="trash-filled-contour"] svg',
    ) as SVGSVGElement;
    const bounds = filled.getBBox();
    return {
      verticalSides: [5.7, 18.3].every((x) =>
        [8, 16].every((y) => body.isPointInStroke(new DOMPoint(x, y))),
      ),
      roundedBase: !(
        filled.querySelector('[data-part="body"] path') as SVGPathElement
      ).isPointInFill(new DOMPoint(5.7, 20.6925)),
      margins: [bounds.y, 24 - bounds.y - bounds.height, bounds.x, 24 - bounds.x - bounds.width],
      stroke: outline.getAttribute('stroke-width'),
    };
  });
  expect(values.verticalSides).toBe(true);
  expect(values.roundedBase).toBe(true);
  for (const margin of values.margins.slice(0, 2)) expect(margin).toBeCloseTo(2.4575, 4);
  for (const margin of values.margins.slice(2)) expect(margin).toBeCloseTo(2.75, 4);
  expect(values.stroke).toBe('1.7');
});

for (const [icon, point] of [
  ['arrow-left', [9, 10]],
  ['arrow-right', [15, 10]],
  ['chevron-down', [12, 10.5]],
  ['chevron-up', [12, 13.5]],
  ['download', [10.5, 11]],
  ['upload', [10.5, 6.75]],
] as const)
  test(`Filled ${icon} has a solid head while Outline remains open`, async ({ page }) => {
    const result = await page.evaluate(
      ({ icon, point }) => {
        const filled = document.querySelector(`[data-testid="${icon}-filled-contour"] svg`)!;
        const outline = document.querySelector(`[data-testid="${icon}-outline-contour"] svg`)!;
        const location = new DOMPoint(point[0], point[1]);
        return {
          filledSolid: Array.from(filled.querySelectorAll('path')).some((path) =>
            path.isPointInFill(location),
          ),
          outlineOpen: !Array.from(outline.querySelectorAll('path')).some((path) =>
            path.isPointInStroke(location),
          ),
        };
      },
      { icon, point: [...point] },
    );
    expect(result).toEqual({ filledSolid: true, outlineOpen: true });
  });

for (const icon of ['download', 'upload'])
  test(`${icon} tray uses standard round corners with aligned Outline and Filled`, async ({
    page,
  }) => {
    const result = await page.evaluate((icon) => {
      const outline = document.querySelector(
        `[data-testid="${icon}-outline-contour"] [data-part="tray"] path`,
      ) as SVGPathElement;
      const filled = document.querySelector(
        `[data-testid="${icon}-filled-contour"] [data-part="tray"] path`,
      ) as SVGPathElement;
      const corner = new DOMPoint(4, 20.5);
      const curve = new DOMPoint(7.25 - 3.25 / Math.SQRT2, 17.25 + 3.25 / Math.SQRT2);
      const box = filled.getBBox();
      return {
        oldSquareCornerClear: !outline.isPointInStroke(corner) && !filled.isPointInFill(corner),
        curvedBand: outline.isPointInStroke(curve) && filled.isPointInFill(curve),
        bounds: [box.x, box.y, box.width, box.height],
      };
    }, icon);
    expect(result.oldSquareCornerClear).toBe(true);
    expect(result.curvedBand).toBe(true);
    for (const [index, value] of result.bounds.entries())
      expect(value).toBeCloseTo([3.15, 15.15, 17.7, 6.2][index], 4);
  });
