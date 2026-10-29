import { expect, it } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { FIGMA_STUDY_ICONS } from '@squircle-icons/core/design/figma-catalog';
const manifest = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
it('exposes exactly the current94 identities with no legacy frame or dataset exports', async () => {
  const names = FIGMA_STUDY_ICONS.map((icon) => './' + icon.id).sort();
  const actual = Object.keys(manifest.exports)
    .filter(
      (key) =>
        !['.', './catalog.json', './design/figma-catalog'].includes(key) &&
        !key.startsWith('./morph/') &&
        !key.startsWith('./motion/'),
    )
    .sort();
  expect(actual).toEqual(names);
  for (const key of [
    './filled',
    './plus-square',
    './arrow-left-circle',
    './log-in',
    './design/squircle-base',
    './design/window-transfer',
  ])
    expect(manifest.exports[key]).toBeUndefined();
  expect(
    (await readdir(new URL('../../src/lib/', import.meta.url))).filter((name) =>
      name.endsWith('.svelte'),
    ),
  ).toHaveLength(94);
});
