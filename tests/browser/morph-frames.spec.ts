import { expect, test } from '@playwright/test';
const pairs = [
  {
    pair: 'menu-x',
    slider: 'Fixture Menu X progress',
    label: 'Menu X fixture',
    from: 'menu',
    to: 'x',
  },
  {
    pair: 'plus-x',
    slider: 'Fixture Plus X progress',
    label: 'Experimental Plus X morph',
    from: 'plus',
    to: 'x',
  },
  {
    pair: 'plus-minus',
    slider: 'Fixture Plus Minus progress',
    label: 'Experimental Plus Minus morph',
    from: 'plus',
    to: 'minus',
  },
];
for (const item of pairs)
  for (const frame of ['none', 'square', 'circle']) {
    test(`${item.pair} Filled uses matching ${frame} sources and exact intermediate stroke unions`, async ({
      page,
    }) => {
      await page.goto('/');
      await page.getByRole('button', { name: `Frame ${frame}`, exact: true }).click();
      const filled = page.getByTestId(item.pair + '-intermediate-filled').locator('svg');
      for (const [name, p] of [
        [item.from, 0],
        [item.to, 1],
      ] as const) {
        await page.getByLabel(item.slider).evaluate((n, p) => {
          (n as HTMLInputElement).value = String(p);
          n.dispatchEvent(new Event('input', { bubbles: true }));
        }, p);
        await expect(filled).toHaveAttribute('data-frame', frame);
        const source = page.getByTestId(name + '-filled-contour').locator('path');
        expect(await filled.locator('path').getAttribute('d')).toBe(await source.getAttribute('d'));
      }
      for (const p of [0.001, 0.2, 0.4, 0.5, 0.65, 0.9, 0.999]) {
        await page.getByLabel(item.slider).evaluate((n, p) => {
          (n as HTMLInputElement).value = String(p);
          n.dispatchEvent(new Event('input', { bubbles: true }));
        }, p);
        const result = await page.evaluate(
          ({ item, frame }) => {
            const svg = document.querySelector(
              `[data-testid="${item.pair}-intermediate-filled"] svg`,
            )! as SVGSVGElement;
            const filled = svg.querySelector('path')!;
            const original =
              item.pair === 'menu-x'
                ? document.querySelector(`[aria-label="${item.label}"]`)!
                : document.querySelector(`[data-testid="${item.pair}-intermediate-outline"] svg`)!;
            const outline = original.cloneNode(true) as SVGSVGElement;
            const width =
              item.pair === 'menu-x'
                ? Number(svg.getAttribute('data-glyph-width'))
                : frame === 'none'
                  ? 2.5
                  : 1.75;
            outline.setAttribute('stroke-width', String(width));
            for (const path of outline.querySelectorAll('path[data-part="middle"]'))
              path.setAttribute(
                'stroke-width',
                String((Number(path.getAttribute('stroke-width')) * width) / 1.75),
              );
            outline.style.position = 'absolute';
            outline.style.visibility = 'hidden';
            document.body.append(outline);
            let mismatches = 0;
            for (let y = 6.25; y < 17.8; y += 0.25)
              for (let x = 6.25; x < 17.8; x += 0.25) {
                const point = new DOMPoint(x, y),
                  ink = [...outline.querySelectorAll('path')].some((path) =>
                    path.isPointInStroke(point),
                  );
                if (filled.isPointInFill(point) !== (frame === 'none' ? ink : !ink)) mismatches++;
              }
            outline.remove();
            return {
              mismatches,
              edge: filled.isPointInFill(new DOMPoint(2.1, 12)),
              shoulder: filled.isPointInFill(new DOMPoint(3, 5)),
              path: filled.getAttribute('d'),
            };
          },
          { item, frame },
        );
        expect(result.mismatches).toBeLessThanOrEqual(8);
        expect(result.edge).toBe(frame !== 'none');
        expect(result.shoulder).toBe(frame === 'square');
        expect(result.path).not.toMatch(/NaN|Infinity/);
      }
    });
  }
