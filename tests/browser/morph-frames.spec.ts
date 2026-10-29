import { expect, test } from '@playwright/test';
const pairs = [
  { pair: 'menu-x', slider: 'Fixture Menu X progress' },
  { pair: 'plus-x', slider: 'Fixture Plus X progress' },
  { pair: 'plus-minus', slider: 'Fixture Plus Minus progress' },
];
for (const item of pairs)
  test(
    item.pair + ' uses current unboxed sources and exact moving Bold unions',
    async ({ page }) => {
      await page.goto('/');
      const filled = page.getByTestId(item.pair + '-intermediate-filled').locator('svg');
      await expect(filled).toHaveAttribute('data-source', 'figma-current');
      await expect(filled).toHaveAttribute('data-frame', 'none');
      for (const p of [0.001, 0.2, 0.4, 0.49, 0.5, 0.51, 0.65, 0.9, 0.999]) {
        await page.getByLabel(item.slider).evaluate((node, p) => {
          (node as HTMLInputElement).value = String(p);
          node.dispatchEvent(new Event('input', { bubbles: true }));
        }, p);
        const mismatch = await page.evaluate((item) => {
          const svg = document.querySelector(
            `[data-testid="${item.pair}-intermediate-filled"] svg`,
          )!;
          const filled = svg.querySelector('path')! as SVGPathElement;
          const outline = document
            .querySelector(`[data-testid="${item.pair}-intermediate-outline"] svg`)!
            .cloneNode(true) as SVGSVGElement;
          outline.setAttribute('stroke-width', '2.5');
          outline.style.visibility = 'hidden';
          document.body.append(outline);
          for (const path of outline.querySelectorAll('path[data-part="middle"]'))
            path.setAttribute(
              'stroke-width',
              String((Number(path.getAttribute('stroke-width')) * 2.5) / 1.5),
            );
          const paths = [...outline.querySelectorAll('path')] as SVGPathElement[];
          let mismatch = 0;
          for (let y = 2.13; y < 22; y += 0.2)
            for (let x = 2.11; x < 22; x += 0.2) {
              const p = new DOMPoint(x, y);
              if (paths.some((path) => path.isPointInStroke(p)) !== filled.isPointInFill(p))
                mismatch++;
            }
          outline.remove();
          return mismatch;
        }, item);
        expect(mismatch).toBeLessThanOrEqual(8);
      }
    },
  );
