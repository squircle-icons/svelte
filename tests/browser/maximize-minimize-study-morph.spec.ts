import { expect, test, type Page } from '@playwright/test';

const morph = (page: Page) =>
  page.getByRole('img', { name: 'Maximize Minimize fixture', exact: true });
async function scrub(page: Page, value: number) {
  await page
    .getByLabel('Fixture Maximize Minimize progress', { exact: true })
    .evaluate((node, value) => {
      (node as HTMLInputElement).value = String(value);
      node.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  await expect(morph(page)).toHaveAttribute('data-progress', value.toFixed(5));
}
async function difference(page: Page, markup: [string, string]) {
  return page.evaluate(async (markup) => {
    const render = async (source: string) => {
      const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement;
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
    const [a, b] = await Promise.all(markup.map(render));
    let mismatches = 0,
      union = 0;
    for (let i = 3; i < a.length; i += 4) {
      const left = a[i] >= 128,
        right = b[i] >= 128;
      if (left || right) union++;
      if (left !== right) mismatches++;
    }
    return mismatches / union;
  }, markup);
}
test.beforeEach(async ({ page }) => {
  await page.goto('/study-morph');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
});

for (const style of ['outline', 'filled'])
  test(`Maximize Minimize ${style} endpoints match packed static artwork`, async ({ page }) => {
    if (style === 'filled')
      await page.getByRole('button', { name: 'Maximize Minimize style', exact: true }).click();
    for (const [name, progress] of [
      ['maximize', 0],
      ['minimize', 1],
    ] as const) {
      await scrub(page, progress);
      await expect(morph(page)).toHaveAttribute('data-state', name);
      await expect(morph(page)).toHaveAttribute('data-frame', 'none');
      const actual = await morph(page).evaluate((node) =>
        new XMLSerializer().serializeToString(node),
      );
      const source = await page
        .getByTestId(`${name}-${style}-contour`)
        .locator('svg')
        .evaluate((node) => new XMLSerializer().serializeToString(node));
      expect(await difference(page, [actual, source])).toBeLessThan(0.006);
    }
  });

test('four rounded corners keep their fixed Bold silhouette while folding', async ({ page }) => {
  const svg = morph(page);
  const initialSvg = await svg.elementHandle();
  const initialPath = await svg.locator('path').elementHandle();
  for (const p of [0.0001, 0.25, 0.49, 0.5, 0.51, 0.75, 0.9999]) {
    await scrub(page, p);
    await expect(svg).toHaveAttribute('stroke-width', '1.5');
    const outline = await svg.evaluate((node) => {
      const copy = node.cloneNode(true) as SVGSVGElement;
      copy.setAttribute('stroke-width', '2.5');
      return new XMLSerializer().serializeToString(copy);
    });
    await page.getByRole('button', { name: 'Maximize Minimize style', exact: true }).click();
    const filled = await svg.evaluate((node) => new XMLSerializer().serializeToString(node));
    expect(await difference(page, [outline, filled])).toBeLessThan(0.006);
    const result = await svg.locator('path').evaluate((node) => {
      const path = node as SVGPathElement,
        box = path.getBBox(),
        d = path.getAttribute('d')!;
      return {
        moves: d.match(/M/g)?.length,
        finite: !/NaN|Infinity/.test(d),
        bounds: [box.x, box.y, box.x + box.width, box.y + box.height],
      };
    });
    expect(result.moves).toBe(4);
    expect(result.finite).toBe(true);
    expect(Math.min(...result.bounds)).toBeGreaterThan(0);
    expect(Math.max(...result.bounds)).toBeLessThan(24);
    await page.getByRole('button', { name: 'Maximize Minimize style', exact: true }).click();
  }
  expect(
    await initialSvg!.evaluate(
      (node) => node === document.querySelector('[aria-label="Maximize Minimize fixture"]'),
    ),
  ).toBe(true);
  expect(
    await initialPath!.evaluate(
      (node) => node === document.querySelector('[aria-label="Maximize Minimize fixture"] path'),
    ),
  ).toBe(true);
});

test('reverses in flight from the current shape without replacing its SVG or path', async ({
  page,
}) => {
  const svg = morph(page),
    original = await svg.elementHandle(),
    body = await svg.locator('path').elementHandle();
  await page.getByRole('button', { name: 'Morph minimize', exact: true }).click();
  await expect
    .poll(async () => Number(await svg.getAttribute('data-progress')))
    .toBeGreaterThan(0.2);
  const reversal = await page.evaluate(async () => {
    const svg = document.querySelector('[aria-label="Maximize Minimize fixture"]')!;
    const before = [
      svg.getAttribute('data-progress'),
      svg.querySelector('path')!.getAttribute('d'),
    ];
    [...document.querySelectorAll('button')]
      .find((node) => node.textContent?.trim() === 'Morph maximize')!
      .click();
    await Promise.resolve();
    return {
      before,
      after: [svg.getAttribute('data-progress'), svg.querySelector('path')!.getAttribute('d')],
    };
  });
  expect(reversal.after).toEqual(reversal.before);
  await expect(svg).toHaveAttribute('data-state', 'maximize');
  expect(
    await original!.evaluate(
      (node) => node === document.querySelector('[aria-label="Maximize Minimize fixture"]'),
    ),
  ).toBe(true);
  expect(
    await body!.evaluate(
      (node) => node === document.querySelector('[aria-label="Maximize Minimize fixture"] path'),
    ),
  ).toBe(true);
});

test('default pace leaves time to read the corner fold and reduced motion switches directly', async ({
  page,
}) => {
  const progress = await page.evaluate(async () => {
    const start = performance.now();
    [...document.querySelectorAll('button')]
      .find((node) => node.textContent?.trim() === 'Morph minimize')!
      .click();
    return new Promise<number>((resolve) => {
      const sample = () => {
        if (performance.now() - start < 400) requestAnimationFrame(sample);
        else
          resolve(
            Number(
              document
                .querySelector('[aria-label="Maximize Minimize fixture"]')!
                .getAttribute('data-progress'),
            ),
          );
      };
      requestAnimationFrame(sample);
    });
  });
  expect(progress).toBeGreaterThan(0.1);
  expect(progress).toBeLessThan(0.85);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(morph(page)).toHaveAttribute('data-state', 'minimize');
  await page.getByRole('button', { name: 'Morph maximize', exact: true }).click();
  await expect(morph(page)).toHaveAttribute('data-state', 'maximize');
});

test('corners pull inward with anchored tips and straighten instead of rotating', async ({
  page,
}) => {
  for (const p of [0.1, 0.25, 0.49, 0.5, 0.51, 0.75, 0.9]) {
    await scrub(page, p);
    const result = await morph(page).evaluate((element) => {
      const svg = element as SVGSVGElement;
      const pieces = (d: string) => d.match(/[Mm][^Mm]*/g)!;
      const original = pieces(
        document.querySelector('[data-testid="maximize-outline-contour"] path')!.getAttribute('d')!,
      );
      const moving = pieces(svg.querySelector('path')!.getAttribute('d')!);
      const endpoints = (d: string) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('visibility', 'hidden');
        svg.append(path);
        const a = path.getPointAtLength(0),
          b = path.getPointAtLength(path.getTotalLength());
        path.remove();
        return [a.x, a.y, b.x, b.y];
      };
      return {
        original: original.map(endpoints),
        moving: moving.map(endpoints),
        straight: moving.every((d) => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', d);
          svg.append(path);
          const length = path.getTotalLength(),
            a = path.getPointAtLength(0),
            b = path.getPointAtLength(length);
          const straight = [0.2, 0.4, 0.6, 0.8].every((t) => {
            const p = path.getPointAtLength(length * t);
            return Math.abs((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) < 0.0001;
          });
          path.remove();
          return straight;
        }),
      };
    });
    result.moving.forEach((points, index) =>
      points.forEach((point, axis) => expect(point).toBeCloseTo(result.original[index][axis], 3)),
    );
    expect(result.straight).toBe(p === 0.5);
  }
});

test('study pauses while hidden and resumes the same inward fold', async ({ page }) => {
  const svg = morph(page);
  await page.getByRole('button', { name: 'Morph minimize', exact: true }).click();
  await expect
    .poll(async () => Number(await svg.getAttribute('data-progress')))
    .toBeGreaterThan(0.1);
  const paused = await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    return document
      .querySelector('[aria-label="Maximize Minimize fixture"]')!
      .getAttribute('data-progress');
  });
  await page.waitForTimeout(200);
  expect(await svg.getAttribute('data-progress')).toBe(paused);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(svg).toHaveAttribute('data-state', 'minimize');
  await page.getByRole('button', { name: 'Unmount moving morphs', exact: true }).click();
  await expect(svg).toHaveCount(0);
  await page.getByRole('button', { name: 'Remount moving morphs', exact: true }).click();
  await expect(svg).toHaveAttribute('data-state', 'minimize');
});
