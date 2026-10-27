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
        const source = page
          .getByTestId((name === 'menu' ? 'morph-menu' : name) + '-filled-contour')
          .locator('path');
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
            const original = document.querySelector(
              `[data-testid="${item.pair}-intermediate-outline"] svg`,
            )!;
            const outline = original.cloneNode(true) as SVGSVGElement;
            const width =
              item.pair === 'menu-x'
                ? Number(svg.getAttribute('data-glyph-width'))
                : frame === 'none'
                  ? 2.5
                  : 1.75;
            outline.setAttribute('stroke-width', String(width));
            outline.querySelector('[data-part="frame"]')?.remove();
            for (const path of outline.querySelectorAll('path[data-part="middle"]'))
              path.setAttribute(
                'stroke-width',
                String((Number(path.getAttribute('stroke-width')) * width) / 1.75),
              );
            outline.style.position = 'absolute';
            outline.style.visibility = 'hidden';
            document.body.append(outline);
            const source = document.querySelector(
              `[data-testid="${item.from === 'menu' ? 'morph-menu' : item.from}-filled-contour"] path`,
            )!;
            const exterior = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            exterior.setAttribute(
              'd',
              frame === 'none' ? '' : source.getAttribute('d')!.match(/[Mm][^Mm]*/g)![0],
            );
            exterior.setAttribute('visibility', 'hidden');
            svg.append(exterior);
            let mismatches = 0;
            // Avoid exact stroke boundaries, whose inclusion varies across SVG engines.
            for (let y = 2.283; y < 21.8; y += 0.25)
              for (let x = 2.317; x < 21.8; x += 0.25) {
                const point = new DOMPoint(x, y),
                  ink = [...outline.querySelectorAll('path')].some((path) =>
                    path.isPointInStroke(point),
                  );
                if (
                  filled.isPointInFill(point) !==
                  (frame === 'none' ? ink : exterior.isPointInFill(point) && !ink)
                )
                  mismatches++;
              }
            const sourceShoulder = exterior.isPointInFill(new DOMPoint(3, 5));
            exterior.remove();
            outline.remove();
            return {
              sourceShoulder,
              mismatches,
              edge: filled.isPointInFill(new DOMPoint(2.1, 12)),
              shoulder: filled.isPointInFill(new DOMPoint(3, 5)),
              path: filled.getAttribute('d'),
            };
          },
          { item, frame },
        );
        expect(result.mismatches).toBeLessThanOrEqual(8);
        if (frame !== 'none') {
          expect(result.edge).toBe(true);
          expect(result.shoulder).toBe(result.sourceShoulder);
        }
        expect(result.path).not.toMatch(/NaN|Infinity/);
      }
    });
  }
