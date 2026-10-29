import { expect, test } from '@playwright/test';

async function ready(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByTestId('ready')).toHaveText('hydrated');
}

test('existing Trash stays static by default and preserves its props', async ({ page }) => {
  await ready(page);
  const icon = page.getByTestId('unified-trash-static').locator('svg');
  await expect(icon).toHaveAttribute('width', '20');
  await expect(icon).toHaveAttribute('stroke-width', '2.5');
  await expect(icon).toHaveAttribute('aria-label', 'Static Trash');
  await expect(icon).not.toHaveAttribute('data-motion');
});

test('unified animate forwards props, reverses on click and keeps its SVG', async ({ page }) => {
  await ready(page);
  const host = page.getByTestId('unified-trash-live');
  const icon = host.locator('svg');
  await expect(icon).toHaveAttribute('data-state', 'closed');
  await expect(icon).toHaveAttribute('width', '32');
  await expect(icon).toHaveAttribute('stroke', '#3155aa');
  await expect(icon).toHaveAttribute('aria-label', 'Interactive Trash');
  await expect(icon).toHaveClass('unified-trash');
  await icon.evaluate((svg) => ((window as any).unifiedTrash = svg));
  await host.getByRole('button', { name: 'Toggle Trash lid', exact: true }).click();
  await expect
    .poll(async () => Number(await icon.getAttribute('data-progress')))
    .toBeGreaterThan(0.1);
  const forward = Number(await icon.getAttribute('data-progress'));
  await host.getByRole('button', { name: 'Toggle Trash lid', exact: true }).click();
  expect(Number(await icon.getAttribute('data-progress'))).toBeGreaterThanOrEqual(forward);
  await expect(icon).toHaveAttribute('data-state', 'closed');
  expect(await icon.evaluate((svg) => (window as any).unifiedTrash === svg)).toBe(true);
  await host.getByRole('button', { name: 'Toggle Trash lid', exact: true }).click();
  await expect(icon).toHaveAttribute('data-state', 'open');
  await expect(page.getByTestId('trash-settled')).toHaveText('true');
  await page.getByRole('button', { name: 'Trash style', exact: true }).click();
  await expect(icon).toHaveAttribute('fill', '#3155aa');
  await expect(icon).toHaveAttribute('stroke', 'none');
  expect(await icon.evaluate((svg) => (window as any).unifiedTrash === svg)).toBe(true);
});

test('animate can be disabled or unmounted during playback without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await ready(page);
  const host = page.getByTestId('unified-trash-live');
  await host.getByRole('button', { name: 'Toggle Trash lid', exact: true }).click();
  await host.getByRole('button', { name: 'Toggle Trash animation', exact: true }).click();
  await expect(host.locator('svg')).not.toHaveAttribute('data-motion');
  await expect(host.locator('svg')).toHaveAttribute('stroke-width', '1.5');
  await host.getByRole('button', { name: 'Toggle Trash animation', exact: true }).click();
  await expect(host.locator('svg')).toHaveAttribute('data-state', 'open');
  await host.getByRole('button', { name: 'Toggle Trash lid', exact: true }).click();
  await host.getByRole('button', { name: 'Mount Trash', exact: true }).click();
  await expect(host.locator('svg')).toHaveCount(0);
  await host.getByRole('button', { name: 'Mount Trash', exact: true }).click();
  await expect(host.locator('svg')).toHaveAttribute('data-state', 'closed');
  expect(errors).toEqual([]);
});

test('unified animate honors reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const host = page.getByTestId('unified-trash-live');
  await host.getByRole('button', { name: 'Toggle Trash lid', exact: true }).click();
  await expect(host.locator('svg')).toHaveAttribute('data-progress', '1.00000');
  await host.getByRole('button', { name: 'Toggle Trash lid', exact: true }).click();
  await expect(host.locator('svg')).toHaveAttribute('data-progress', '0.00000');
});

test('static mode never mounts the motion visibility lifecycle', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).trashListeners = new Set();
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (this === document && type === 'visibilitychange' && listener)
        (window as any).trashListeners.add(listener);
      return add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      if (this === document && type === 'visibilitychange' && listener)
        (window as any).trashListeners.delete(listener);
      return remove.call(this, type, listener, options);
    };
  });
  await ready(page);
  const count = () => page.evaluate(() => (window as any).trashListeners.size as number);
  const mounted = await count();
  const host = page.getByTestId('unified-trash-live');
  await host.getByRole('button', { name: 'Toggle Trash animation', exact: true }).click();
  await expect.poll(count).toBe(mounted - 1);
  await host.getByRole('button', { name: 'Toggle Trash lid', exact: true }).click();
  await host.getByRole('button', { name: 'Mount Trash', exact: true }).click();
  await host.getByRole('button', { name: 'Mount Trash', exact: true }).click();
  expect(await count()).toBe(mounted - 1);
  await host.getByRole('button', { name: 'Toggle Trash animation', exact: true }).click();
  await expect.poll(count).toBe(mounted);
  await host.getByRole('button', { name: 'Mount Trash', exact: true }).click();
  await expect.poll(count).toBe(mounted - 1);
});
