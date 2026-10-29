import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { releaseStatus, waitForPublication } from '../../tools/release-status.mjs';

const manifest = {
  name: '@squircle-icons/svelte',
  version: '0.1.0-alpha.5',
  repository: { url: 'git+https://github.com/squircle-icons/svelte.git' },
  publishConfig: { registry: 'https://registry.npmjs.org/' },
};
const archive = Buffer.from('the archive already tested by the quality job');
const integrity = 'sha512-' + createHash('sha512').update(archive).digest('base64');
const published = (value) =>
  new Response(JSON.stringify({ ...manifest, dist: { integrity: value } }));

test('only a missing registry version permits a new publication', async () => {
  const status = await releaseStatus(manifest, archive, async (url, options) => {
    assert.equal(url, 'https://registry.npmjs.org/@squircle-icons%2fsvelte/0.1.0-alpha.5');
    assert.equal(options.cache, 'no-store');
    return new Response('', { status: 404 });
  });
  assert.equal(status.mode, 'publish');
  assert.equal(status.integrity, integrity);
  assert.equal(status.archive, '.artifacts/squircle-icons-svelte-0.1.0-alpha.5.tgz');
});

test('an exact already-published archive permits tag recovery without republishing', async () => {
  const status = await releaseStatus(manifest, archive, async () => published(integrity));
  assert.equal(status.mode, 'tags');
});

test('an existing version with different contents is skipped until its version is bumped', async () => {
  const status = await releaseStatus(manifest, archive, async () => published('sha512-other'));
  assert.equal(status.mode, 'skip');
});

test('registry errors and network failures never become permission to publish', async () => {
  for (const status of [401, 403, 429, 500])
    await assert.rejects(
      releaseStatus(manifest, archive, async () => new Response('', { status })),
      new RegExp(`HTTP ${status}`),
    );
  await assert.rejects(
    releaseStatus(manifest, archive, async () => {
      throw new Error('Network unavailable');
    }),
    /Network unavailable/,
  );
});

test('malformed registry data and mismatched identities fail closed', async () => {
  for (const data of [
    'not json',
    JSON.stringify({ ...manifest, name: 'another-package', dist: { integrity } }),
    JSON.stringify({ ...manifest, version: '0.0.0', dist: { integrity } }),
    JSON.stringify(manifest),
  ])
    await assert.rejects(releaseStatus(manifest, archive, async () => new Response(data)));
});

test('invalid versions and unexpected package settings are rejected before any request', async () => {
  for (const change of [
    { name: 'another-package' },
    { private: true },
    { version: '0.1.0\nmode=publish' },
    { version: '../outside' },
    { version: 'v0.1.0' },
    { repository: { url: 'https://github.com/another/repository' } },
    { publishConfig: { registry: 'https://another.example' } },
  ])
    await assert.rejects(
      releaseStatus({ ...manifest, ...change }, archive, async () => {
        assert.fail('Invalid release metadata must not reach the registry');
      }),
    );
});

test('publication polling waits for processing and checks the exact public archive', async () => {
  let requests = 0;
  const pauses = [];
  await waitForPublication(manifest, integrity, {
    request: async (url, options) => {
      assert.equal(url, 'https://registry.npmjs.org/@squircle-icons%2fsvelte/0.1.0-alpha.5');
      assert.equal(options.cache, 'no-store');
      assert.equal(options.headers, undefined);
      return ++requests < 3 ? new Response('', { status: 404 }) : published(integrity);
    },
    pause: async (ms) => pauses.push(ms),
    interval: 17,
  });
  assert.equal(requests, 3);
  assert.deepEqual(pauses, [17, 17]);
});

test('publication polling has a bounded deadline without an extra final delay', async () => {
  let requests = 0;
  let pauses = 0;
  await assert.rejects(
    waitForPublication(manifest, integrity, {
      request: async () => {
        requests++;
        return new Response('', { status: 404 });
      },
      pause: async () => {
        pauses++;
      },
      attempts: 3,
    }),
    /deadline/,
  );
  assert.equal(requests, 3);
  assert.equal(pauses, 2);
});

test('publication polling rejects unexpected archive bytes immediately', async () => {
  await assert.rejects(
    waitForPublication(manifest, integrity, { request: async () => published('sha512-other') }),
    /differs from tested artifact/,
  );
});

test('publication polling exposes registry, network, and malformed metadata errors', async () => {
  for (const status of [401, 403, 429, 500])
    await assert.rejects(
      waitForPublication(manifest, integrity, {
        request: async () => new Response('', { status }),
      }),
      new RegExp(`HTTP ${status}`),
    );
  await assert.rejects(
    waitForPublication(manifest, integrity, {
      request: async () => {
        throw new Error('Network unavailable');
      },
    }),
    /Network unavailable/,
  );
  await assert.rejects(
    waitForPublication(manifest, integrity, { request: async () => new Response('not json') }),
  );
  await assert.rejects(
    waitForPublication(manifest, integrity, {
      request: async () =>
        new Response(JSON.stringify({ ...manifest, name: 'another-package', dist: { integrity } })),
    }),
    /package mismatch/,
  );
});
