import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function validateManifest(manifest) {
  assert.equal(manifest.name, '@squircle-icons/svelte', 'Unexpected release package');
  assert(!manifest.private, 'Cannot release a private package');
  assert(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.test(
      manifest.version,
    ),
    'Invalid release version',
  );
  assert.equal(manifest.repository?.url, 'git+https://github.com/squircle-icons/svelte.git');
  assert.equal(manifest.publishConfig?.registry, 'https://registry.npmjs.org/');
}

export async function releaseStatus(manifest, archive, request = fetch) {
  validateManifest(manifest);
  const integrity = 'sha512-' + createHash('sha512').update(archive).digest('base64');
  const response = await request(
    `https://registry.npmjs.org/@squircle-icons%2fsvelte/${encodeURIComponent(manifest.version)}`,
    { signal: AbortSignal.timeout(15000), cache: 'no-store' },
  );
  let mode = 'publish';
  if (response.status !== 404) {
    assert(response.ok, `npm registry returned HTTP ${response.status}`);
    const published = await response.json();
    assert.equal(published.name, manifest.name, 'Registry package mismatch');
    assert.equal(published.version, manifest.version, 'Registry version mismatch');
    assert.equal(typeof published.dist?.integrity, 'string', 'Missing npm integrity');
    // A retry may finish the tags only for the exact archive this workflow tested.
    mode = published.dist.integrity === integrity ? 'tags' : 'skip';
  }
  return {
    mode,
    version: manifest.version,
    archive: `.artifacts/squircle-icons-svelte-${manifest.version}.tgz`,
    integrity,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = new URL('../', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  validateManifest(manifest);
  const archive = await readFile(
    new URL(`.artifacts/squircle-icons-svelte-${manifest.version}.tgz`, root),
  );
  const status = await releaseStatus(manifest, archive);
  if (process.env.GITHUB_OUTPUT)
    await appendFile(
      process.env.GITHUB_OUTPUT,
      Object.entries(status)
        .map(([key, value]) => `${key}=${value}\n`)
        .join(''),
    );
  console.log(JSON.stringify(status));
}
