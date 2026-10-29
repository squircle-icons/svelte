import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
it('keeps icon Motion separate from Morph in the public imports', async () => {
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));
  expect(manifest.exports['./motion/trash'].svelte).toBe('./dist/motion/TrashMotion.svelte');
  expect(manifest.exports['./morph/trash']).toBeUndefined();
  expect(manifest.exports['./morph/sun-moon']).toBeDefined();
});
