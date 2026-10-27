import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flattenCoreIcons, type StaticIcon } from './static-icons.js';

/** Local review packs may contain drafts; public releases must not. */
export function assertReleaseReady(icons: readonly StaticIcon[]) {
  assert(icons.length > 0, 'Cannot publish an empty icon collection');
  const pending = icons.filter(
    (icon) =>
      icon.metadata.review?.status !== 'approved' ||
      (icon.filled && icon.filled.metadata.review?.status !== 'approved'),
  );
  assert.equal(
    pending.length,
    0,
    `Unapproved static artwork must stay in local review packs: ${pending.map((icon) => icon.name).join(', ')}`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const icons = flattenCoreIcons(
    JSON.parse(
      await readFile(new URL(import.meta.resolve('@squircle-icons/core/catalog.json')), 'utf8'),
    ),
  );
  assertReleaseReady(icons);
  console.log(`Verified owner approval for ${icons.length} static release icons and their styles.`);
}
