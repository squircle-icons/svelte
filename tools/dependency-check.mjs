import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const lock = JSON.parse(await readFile(new URL('dependency-lock.json', root), 'utf8'));
assert(/^[a-f0-9]{40}$/.test(lock.commit), 'Dependency must pin a full Git commit');
assert(
  lock.repository === 'https://github.com/squircle-icons/core',
  'Unexpected dependency repository',
);
const actual = createHash('sha256')
  .update(await readFile(new URL(lock.artifact, root)))
  .digest('hex');
assert.equal(actual, lock.sha256, 'Dependency artifact changed without updating provenance');
const installed = JSON.parse(
  await readFile(fileURLToPath(import.meta.resolve('@squircle-icons/core/catalog.json')), 'utf8'),
);
const expected = JSON.parse(await readFile(new URL('vendor/core-catalog.json', root), 'utf8'));
assert.deepEqual(installed, expected, 'Installed dependency differs from the recorded snapshot');
console.log(`Verified core commit ${lock.commit} and artifact SHA-256.`);
