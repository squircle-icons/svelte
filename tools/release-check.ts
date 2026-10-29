import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CoreIcon } from '@squircle-icons/core/catalog-types';

/** Alpha publication authorization is separate from visual approval. */
export function assertReleaseReady(icons: readonly CoreIcon[], version: string) {
  assert(icons.length > 0, 'Cannot publish an empty icon collection');
  assert.equal(
    new Set(icons.map((icon) => icon.name)).size,
    icons.length,
    'Duplicate release identities',
  );
  const alpha = /^\d+\.\d+\.\d+-alpha\.\d+$/.test(version);
  for (const icon of icons) {
    assert(icon.root && icon.filled?.root, `Incomplete source pair: ${icon.name}`);
    for (const status of [icon.metadata.review?.status, icon.filled.metadata.review?.status]) {
      assert(
        status === 'approved' || (alpha && status === 'draft'),
        `Unapproved or missing source review: ${icon.name}`,
      );
    }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const icons: CoreIcon[] = JSON.parse(
    await readFile(new URL(import.meta.resolve('@squircle-icons/core/catalog.json')), 'utf8'),
  );
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assertReleaseReady(icons, manifest.version);
  console.log(
    `Verified ${icons.length} complete release pairs; alpha preserves draft statuses, stable requires approval.`,
  );
}
