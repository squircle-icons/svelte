import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { createGitHubRelease } from '../../tools/github-release.mjs';

function scenario(options = {}) {
  const version = options.version ?? '0.1.0-alpha.6';
  const manifest = {
    name: '@squircle-icons/svelte',
    version,
    repository: { url: 'git+https://github.com/squircle-icons/svelte.git' },
    publishConfig: { registry: 'https://registry.npmjs.org/' },
  };
  const digest = createHash('sha512').update('tested package').digest();
  const integrity = 'sha512-' + digest.toString('base64');
  const commit = 'a'.repeat(40);
  const proof = {
    predicateType: 'https://slsa.dev/provenance/v1',
    subject: [
      {
        name: `pkg:npm/%40squircle-icons/svelte@${version}`,
        digest: { sha512: digest.toString('hex') },
      },
    ],
    predicate: {
      buildDefinition: {
        externalParameters: {
          workflow: {
            ref: 'refs/heads/main',
            repository: 'https://github.com/squircle-icons/svelte',
            path: '.github/workflows/quality.yml',
          },
        },
        resolvedDependencies: [
          {
            uri: 'git+https://github.com/squircle-icons/svelte@refs/heads/main',
            digest: { gitCommit: commit },
          },
        ],
      },
    },
  };
  options.changeProof?.(proof);
  let tagged = options.tagged ?? options.existing ?? false;
  let released = options.existing ?? false;
  const posts = [];
  const tagPosts = [];
  const calls = [];
  const release = {
    tag_name: `v${version}`,
    name: version,
    draft: false,
    prerelease: version.includes('-'),
    body: 'Maintainer-written notes',
    html_url: `https://github.com/squircle-icons/svelte/releases/tag/v${version}`,
    ...options.release,
  };
  const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
  async function request(url, config) {
    calls.push({ url, config });
    if (options.fail?.(url, config)) return response({}, options.status ?? 500);
    if (url.startsWith('https://registry.npmjs.org/')) {
      assert.equal(config.headers, undefined, 'GitHub token must never reach npm');
      if (url.includes('/attestations/'))
        return response({
          attestations: [
            {
              predicateType: 'https://slsa.dev/provenance/v1',
              bundle: {
                dsseEnvelope: { payload: Buffer.from(JSON.stringify(proof)).toString('base64') },
              },
            },
          ],
        });
      return response({ ...manifest, dist: { integrity: options.registryIntegrity ?? integrity } });
    }
    assert.equal(config.headers.Authorization, 'Bearer test-token');
    if (url.endsWith('/git/refs') && config.method === 'POST') {
      const body = JSON.parse(config.body);
      tagPosts.push(body);
      tagged = true;
      return response({ ref: body.ref, object: { type: 'commit', sha: body.sha } }, 201);
    }
    if (url.endsWith(`/git/ref/tags/v${version}`))
      return tagged
        ? response({
            ref: `refs/tags/v${version}`,
            object: options.annotated
              ? { type: 'tag', sha: 'c'.repeat(40) }
              : { type: 'commit', sha: options.tagCommit ?? commit },
          })
        : response({}, 404);
    if (url.endsWith(`/git/tags/${'c'.repeat(40)}`))
      return response({
        object: options.cyclic
          ? { type: 'tag', sha: 'c'.repeat(40) }
          : { type: 'commit', sha: options.tagCommit ?? commit },
      });
    if (url.endsWith(`/releases/tags/v${version}`))
      return released ? response(release) : response({}, 404);
    assert(url.endsWith('/releases') && config.method === 'POST', 'Unexpected GitHub mutation');
    posts.push(JSON.parse(config.body));
    tagged = released = true;
    return response(release, 201);
  }
  return {
    input: { manifest, integrity, token: 'test-token' },
    request,
    posts,
    tagPosts,
    calls,
    commit,
    release,
  };
}

test('creates a version-named prerelease only after matching published npm provenance', async () => {
  const s = scenario();
  assert.equal(await createGitHubRelease(s.input, s.request), s.release.html_url);
  assert.equal(s.posts.length, 1);
  assert.equal(s.posts[0].name, '0.1.0-alpha.6');
  assert.equal(s.posts[0].tag_name, 'v0.1.0-alpha.6');
  assert.deepEqual(s.tagPosts, [{ ref: 'refs/tags/v0.1.0-alpha.6', sha: s.commit }]);
  assert.equal(s.posts[0].prerelease, true);
  assert.equal(s.posts[0].make_latest, 'false');
  assert(s.posts[0].body.includes(s.commit));
  assert(s.calls.slice(0, 2).every((call) => call.url.startsWith('https://registry.npmjs.org/')));
});

test('stable versions use a full release and native semantic latest selection', async () => {
  const s = scenario({ version: '1.0.0' });
  await createGitHubRelease(s.input, s.request);
  assert.equal(s.posts[0].prerelease, false);
  assert.equal(s.posts[0].make_latest, 'legacy');
});

test('reruns preserve existing notes and never create or rewrite another release', async () => {
  const s = scenario();
  await createGitHubRelease(s.input, s.request);
  await createGitHubRelease(s.input, s.request);
  assert.equal(s.posts.length, 1);
  assert.equal(s.tagPosts.length, 1);
  assert.equal(s.release.body, 'Maintainer-written notes');
});

test('existing annotated tags are resolved and retained at the published source commit', async () => {
  const s = scenario({ tagged: true, annotated: true });
  await createGitHubRelease(s.input, s.request);
  assert.equal(s.posts[0].target_commitish, undefined);
  assert.equal(s.tagPosts.length, 0);
  assert(s.calls.some((call) => call.url.includes('/git/tags/')));
});

test('a lost response after GitHub accepts creation can be retried without duplication', async () => {
  for (const endpoint of ['/git/refs', '/releases']) {
    const s = scenario();
    await assert.rejects(
      createGitHubRelease(s.input, async (url, config) => {
        const response = await s.request(url, config);
        if (config.method === 'POST' && url.endsWith(endpoint))
          throw new Error('Response lost after creation');
        return response;
      }),
      /Response lost/,
    );
    await createGitHubRelease(s.input, s.request);
    assert.equal(s.posts.length, 1);
    assert.equal(s.tagPosts.length, 1);
  }
});

test('mismatched archive, package subject, workflow, or source cannot create a release', async () => {
  for (const change of [
    { registryIntegrity: 'sha512-other' },
    {
      changeProof: (p) => {
        p.subject[0].digest.sha512 = 'bad';
      },
    },
    {
      changeProof: (p) => {
        p.subject[0].name = 'another-package';
      },
    },
    {
      changeProof: (p) => {
        p.predicate.buildDefinition.externalParameters.workflow.ref = 'refs/heads/draft';
      },
    },
    {
      changeProof: (p) => {
        p.predicate.buildDefinition.externalParameters.workflow.repository =
          'https://github.com/another/repo';
      },
    },
    {
      changeProof: (p) => {
        p.predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit = '../main';
      },
    },
  ]) {
    const s = scenario(change);
    await assert.rejects(createGitHubRelease(s.input, s.request));
    assert.equal(s.posts.length, 0);
    assert(s.calls.every((call) => !call.url.startsWith('https://api.github.com/')));
  }
});

test('conflicting tags and existing drafts or titles stop without overwriting user work', async () => {
  for (const options of [
    { tagged: true, tagCommit: 'b'.repeat(40) },
    { tagged: true, annotated: true, cyclic: true },
    { existing: true, release: { draft: true } },
    { existing: true, release: { name: 'another title' } },
  ]) {
    const s = scenario(options);
    await assert.rejects(createGitHubRelease(s.input, s.request));
    assert.equal(s.posts.length, 0);
  }
});

test('registry and GitHub errors are never treated as a missing release', async () => {
  for (const options of [
    { status: 404, fail: (url) => url.startsWith('https://registry.npmjs.org/') },
    { status: 403, fail: (url) => url.includes('/releases/tags/') },
    { status: 429, fail: (url) => url.includes('/git/ref/') },
    { status: 500, fail: (url) => url.includes('/releases/tags/') },
  ]) {
    const s = scenario(options);
    await assert.rejects(createGitHubRelease(s.input, s.request), /HTTP/);
    assert.equal(s.posts.length, 0);
  }
  const s = scenario();
  await assert.rejects(
    createGitHubRelease(s.input, async () => {
      throw new Error('Network unavailable');
    }),
    /Network unavailable/,
  );
});

test('invalid release identity or missing tested integrity/token fails before network access', async () => {
  const s = scenario();
  for (const input of [
    { ...s.input, token: '' },
    { ...s.input, integrity: undefined },
    { ...s.input, manifest: { ...s.input.manifest, version: '1.0.0\nmode=publish' } },
  ])
    await assert.rejects(
      createGitHubRelease(input, async () => {
        assert.fail('Unexpected request');
      }),
    );
});
