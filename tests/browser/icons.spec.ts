import { test, expect, type Page, type Locator } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const folder = (page: Page) => page.getByTestId('folder').locator('[data-part="lid"]');
const moving = (page: Page) => page.getByTestId('moving');
const countAnimations = (page: Page) => page.evaluate(() => document.getAnimations().length);
const transform = (locator: Locator) =>
  locator.evaluate((element) => getComputedStyle(element).transform);
async function pauseAt(page: Page, time: number) {
  await page.evaluate((ms) => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = ms;
    }
  }, time);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const probe = { active: 0, adds: 0, removes: 0, saved: [] as Element[] };
    (window as any).__motionProbe = probe;
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const media = original(query);
      if (query !== '(prefers-reduced-motion: reduce)') return media;
      const add = media.addEventListener.bind(media);
      const remove = media.removeEventListener.bind(media);
      const listeners = new Set<EventListenerOrEventListenerObject>();
      media.addEventListener = ((
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: any,
      ) => {
        if (type === 'change' && !listeners.has(listener)) {
          listeners.add(listener);
          probe.active++;
          probe.adds++;
        }
        add(type, listener, options);
      }) as typeof media.addEventListener;
      media.removeEventListener = ((
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: any,
      ) => {
        if (type === 'change' && listeners.delete(listener)) {
          probe.active--;
          probe.removes++;
        }
        remove(type, listener, options);
      }) as typeof media.removeEventListener;
      return media;
    };
  });
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
});

test('SSR and hydration preserve initial state, naming, and multiple instances', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/hydration|mismatch/i.test(message.text())) errors.push(message.text());
  });
  const html = await (await request.get('/')).text();
  expect(html).toContain('scaleY(0.72)');
  await page.reload();
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  await expect(page.getByRole('img', { name: 'Camera one', exact: true })).toHaveCount(1);
  await expect(page.getByRole('img', { name: 'Camera two', exact: true })).toHaveCount(1);
  await expect(page.getByTestId('instances').locator('svg[aria-hidden="true"]')).toHaveCount(3);
  await expect(page.locator('svg title, svg [id], svg[tabindex]')).toHaveCount(0);
  expect(await countAnimations(page)).toBe(0);
  expect(await transform(page.getByTestId('initial-open').locator('[data-part="lid"]'))).toContain(
    '0.72',
  );
  expect(errors).toEqual([]);
});

test('folder opens, closes, and resets to its controlled state', async ({ page }) => {
  // Observe the short transition within the same browser turn; remote WebKit
  // can complete it before a separate polling command reaches the page.
  const started = await page
    .getByRole('button', { name: 'Toggle folder' })
    .evaluate(async (button) => {
      (button as HTMLButtonElement).click();
      await Promise.resolve();
      const animations = document.getAnimations();
      for (const animation of animations) animation.pause();
      return animations.length;
    });
  expect(started).toBe(1);
  await page.evaluate(() => document.getAnimations().forEach((animation) => animation.play()));
  await expect.poll(() => countAnimations(page)).toBe(0);
  expect(await transform(folder(page))).toContain('0.72');
  await page.getByRole('button', { name: 'Toggle folder' }).click();
  await pauseAt(page, 80);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  expect(await countAnimations(page)).toBe(0);
  expect(await transform(folder(page))).toBe('matrix(1, 0, 0, 1, 0, 0)');
});

test('folder retargets from the visible pose during interruption', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle folder' }).click();
  await pauseAt(page, 90);
  const before = await transform(folder(page));
  const startingFrame = await page.evaluate(() => {
    Array.from(document.querySelectorAll('button'))
      .find((button) => button.textContent === 'Toggle folder')!
      .click();
    return new Promise<string>((resolve) =>
      queueMicrotask(() => {
        const target = document.querySelector('[data-testid="folder"] [data-part="lid"]')!;
        const animation = target.getAnimations()[0];
        animation.pause();
        animation.currentTime = 0;
        resolve((animation.effect as KeyframeEffect).getKeyframes()[0].transform as string);
      }),
    );
  });
  expect(startingFrame).toBe(before);
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  expect(await countAnimations(page)).toBe(0);
});

test('bell plays once, replays without stacking, and returns to rest', async ({ page }) => {
  const play = page.getByRole('button', { name: 'Play bell' });
  await play.click();
  await expect.poll(() => countAnimations(page)).toBe(2);
  await pauseAt(page, 100);
  expect(await transform(page.getByTestId('bell').locator('[data-part="body"]'))).not.toBe(
    'matrix(1, 0, 0, 1, 0, 0)',
  );
  await play.click();
  expect(await countAnimations(page)).toBe(2);
  await expect.poll(() => countAnimations(page)).toBe(0);
  expect(await transform(page.getByTestId('bell').locator('[data-part="body"]'))).toBe(
    'matrix(1, 0, 0, 1, 0, 0)',
  );
});

test('hover is opt-in and restores folder state without interrupting bell', async ({ page }) => {
  const folderSvg = page.getByTestId('folder').locator('svg');
  await folderSvg.hover();
  expect(await countAnimations(page)).toBe(0);
  await page.getByLabel('Hover', { exact: true }).check();
  await folderSvg.hover();
  await expect.poll(() => countAnimations(page)).toBe(0);
  expect(await transform(folder(page))).toContain('0.72');
  await page.mouse.move(0, 0);
  await expect.poll(() => countAnimations(page)).toBe(0);
  expect(await transform(folder(page))).toBe('matrix(1, 0, 0, 1, 0, 0)');
  await page.getByRole('button', { name: 'Toggle folder' }).click();
  await folderSvg.hover();
  await page.mouse.move(0, 0);
  await expect.poll(() => countAnimations(page)).toBe(0);
  expect(await transform(folder(page))).toContain('0.72');
  await page.getByTestId('bell').locator('svg').hover();
  await pauseAt(page, 80);
  await page.mouse.move(0, 0);
  expect(await countAnimations(page)).toBe(2);
});

test('reduced motion preserves state and suppresses ringing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => countAnimations(page)).toBe(0);
  await page.getByRole('button', { name: 'Toggle folder' }).click();
  await page.getByRole('button', { name: 'Play bell' }).click();
  expect(await countAnimations(page)).toBe(0);
  expect(await transform(folder(page))).toContain('0.72');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByLabel('Always reduce').check();
  await page.getByRole('button', { name: 'Play bell' }).click();
  expect(await countAnimations(page)).toBe(0);
});

test('preference changes cancel active motion and settle on the target', async ({ page }) => {
  await page.getByRole('button', { name: 'Toggle folder' }).click();
  await page.getByRole('button', { name: 'Play bell' }).click();
  await pauseAt(page, 80);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => countAnimations(page)).toBe(0);
  expect(await transform(folder(page))).toContain('0.72');
  expect(await transform(page.getByTestId('bell').locator('[data-part="body"]'))).toBe(
    'matrix(1, 0, 0, 1, 0, 0)',
  );
});

test('unmount cancels detached animations and removes preference listeners', async ({ page }) => {
  const baseline = await page.evaluate(() => (window as any).__motionProbe.active);
  await page.getByRole('button', { name: 'Play bell' }).click();
  await pauseAt(page, 100);
  await page.evaluate(() => {
    (window as any).__motionProbe.saved = Array.from(
      document.querySelectorAll('[data-testid="moving"] svg'),
    );
  });
  await page.getByRole('button', { name: 'Unmount', exact: true }).click();
  expect(await countAnimations(page)).toBe(0);
  expect(
    await page.evaluate(
      () =>
        (window as any).__motionProbe.saved.flatMap((element: Element) =>
          element.getAnimations({ subtree: true }),
        ).length,
    ),
  ).toBe(0);
  expect(await page.evaluate(() => (window as any).__motionProbe.active)).toBe(baseline - 2);
  await page.getByRole('button', { name: 'Mount', exact: true }).click();
  expect(await page.evaluate(() => (window as any).__motionProbe.active)).toBe(baseline);
});

test('presentation updates do not overwrite motion-owned styles', async ({ page }) => {
  await expect(page.getByTestId('filled-folder').locator('svg')).toHaveAttribute(
    'data-cutout-width',
    '1.75',
  );
  await page.getByRole('button', { name: 'Toggle folder' }).click();
  await expect.poll(() => countAnimations(page)).toBe(0);
  const before = await transform(folder(page));
  await page.getByRole('button', { name: 'Change presentation' }).click();
  await expect(page.getByTestId('folder').locator('svg')).toHaveAttribute('width', '64');
  await expect(page.getByTestId('folder').locator('svg')).toHaveAttribute('stroke', '#6b50a1');
  await expect(page.getByTestId('folder').locator('svg')).toHaveAttribute('stroke-width', '2');
  expect(await transform(folder(page))).toBe(before);
  await expect(page.getByTestId('filled-folder').locator('svg')).toHaveAttribute(
    'data-cutout-width',
    '2',
  );
  await expect(page.getByTestId('filled-folder').locator('svg')).toHaveAttribute('stroke', 'none');
});

test('missing animation API falls back to settled poses', async ({ page }) => {
  await page.addInitScript(() => {
    (Element.prototype as any).animate = undefined;
  });
  await page.reload();
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
  await page.getByRole('button', { name: 'Toggle folder' }).click();
  await page.getByRole('button', { name: 'Play bell' }).click();
  expect(await countAnimations(page)).toBe(0);
  expect(await transform(folder(page))).toContain('0.72');
});

test('captures static artwork and reproducible motion poses', async ({ page }, info) => {
  await expect(page.getByTestId('contact-sheet')).toHaveScreenshot('contact-sheet.png');
  await expect(page.getByTestId('filled-contact-sheet')).toHaveScreenshot(
    'filled-contact-sheet.png',
  );
  await expect(moving(page)).toHaveScreenshot('motion-rest.png');
  await page.getByRole('button', { name: 'Toggle folder' }).click();
  await expect.poll(() => countAnimations(page)).toBe(0);
  await expect(moving(page)).toHaveScreenshot('folder-open.png');
  await page.getByRole('button', { name: 'Play bell' }).click();
  await pauseAt(page, 96);
  await expect(moving(page)).toHaveScreenshot('bell-mid-ring.png', { animations: 'allow' });
  if (info.project.name === 'chromium') {
    await mkdir('.artifacts/previews', { recursive: true });
    await page
      .getByTestId('contact-sheet')
      .screenshot({ path: '.artifacts/previews/contact-sheet.png' });
    await moving(page).screenshot({ path: '.artifacts/previews/motion.png', animations: 'allow' });
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

for (const icon of ['settings', 'bell'])
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
          // The hub's white interior is the same empty space as the Filled counter.
          svg.querySelector('circle')?.setAttribute('fill', '#fff');
          // Bell's open clapper stays unfilled in the reference.
          svg.querySelector('[data-part="clapper"]')?.setAttribute('fill', 'none');
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
    for (const result of results) {
      // Ignore only the one-pixel antialiasing fringe at 40x magnification.
      expect(result.distantMismatches, JSON.stringify(result)).toBe(0);
      expect(result.mismatches, JSON.stringify(result)).toBeLessThan(960 * 960 * 0.002);
    }
  });
