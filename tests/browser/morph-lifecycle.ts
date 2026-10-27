import { expect, test } from '@playwright/test';
declare global {
  interface Window {
    motionProbe: { pending: Set<number>; listeners: Set<EventListenerOrEventListenerObject> };
  }
}
export function registerMorphLifecycle(label: string, openButton: string, finalState: string) {
  test(`${label} pauses hidden playback and resumes from the same position`, async ({ page }) => {
    await page.goto('/');
    const svg = page.getByRole('img', { name: label, exact: true });
    await page.getByRole('button', { name: openButton, exact: true }).click();
    await expect
      .poll(async () => Number(await svg.getAttribute('data-progress')))
      .toBeGreaterThan(0.1);
    const paused = await page.evaluate((label) => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      return document.querySelector(`[aria-label="${label}"]`)!.getAttribute('data-progress');
    }, label);
    await page.waitForTimeout(200);
    expect(await svg.getAttribute('data-progress')).toBe(paused);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(svg).toHaveAttribute('data-state', finalState);
  });
  test(`${label} cancels frames and removes its visibility listener on unmount`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const probe = (window.motionProbe = {
        pending: new Set<number>(),
        listeners: new Set<EventListenerOrEventListenerObject>(),
      });
      const request = window.requestAnimationFrame.bind(window),
        cancel = window.cancelAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) => {
        const id = request((time) => {
          probe.pending.delete(id);
          callback(time);
        });
        probe.pending.add(id);
        return id;
      };
      window.cancelAnimationFrame = (id) => {
        probe.pending.delete(id);
        cancel(id);
      };
      const add = EventTarget.prototype.addEventListener,
        remove = EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (this === document && type === 'visibilitychange' && listener)
          probe.listeners.add(listener);
        return add.call(this, type, listener, options);
      };
      EventTarget.prototype.removeEventListener = function (type, listener, options) {
        if (this === document && type === 'visibilitychange' && listener)
          probe.listeners.delete(listener);
        return remove.call(this, type, listener, options);
      };
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await expect(page.getByTestId('ready')).toHaveText('hydrated');
    const listeners = await page.evaluate(() => window.motionProbe.listeners.size);
    const svg = page.getByRole('img', { name: label, exact: true });
    await page.getByRole('button', { name: openButton, exact: true }).click();
    await expect
      .poll(async () => Number(await svg.getAttribute('data-progress')))
      .toBeGreaterThan(0.1);
    await page.getByRole('button', { name: 'Unmount moving morphs', exact: true }).click();
    await expect(svg).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.motionProbe.pending.size)).toBe(0);
    expect(await page.evaluate(() => window.motionProbe.listeners.size)).toBe(listeners - 3);
    await page.getByRole('button', { name: 'Remount moving morphs', exact: true }).click();
    await expect(svg).toHaveAttribute('data-state', finalState);
    expect(await page.evaluate(() => window.motionProbe.listeners.size)).toBe(listeners);
    expect(errors).toEqual([]);
  });
}
