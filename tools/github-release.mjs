import assert from 'node:assert/strict';
import { appendFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest } from './release-status.mjs';

const repository = 'squircle-icons/svelte';
const provenanceType = 'https://slsa.dev/provenance/v1';

export async function createGitHubRelease({ manifest, integrity, token }, request = fetch) {
  validateManifest(manifest);
  assert(/^sha512-[A-Za-z0-9+/]{86}==$/.test(integrity), 'Missing tested archive integrity');
  assert(typeof token === 'string' && token.length > 0, 'Missing GitHub release token');
  const version = manifest.version;
  const tag = `v${version}`;
  const prerelease = version.includes('-');
  async function json(url, options = {}, missing = false) {
    const response = await request(url, {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
      ...options,
    });
    if (missing && response.status === 404) return null;
    assert(response.ok, `${options.method ?? 'GET'} ${url} returned HTTP ${response.status}`);
    return response.json();
  }
  const published = await json(`https://registry.npmjs.org/@squircle-icons%2fsvelte/${version}`);
  assert.equal(published.name, manifest.name, 'Published package mismatch');
  assert.equal(published.version, version, 'Published version mismatch');
  assert.equal(
    published.dist?.integrity,
    integrity,
    'Published archive differs from tested artifact',
  );
  const attestations = await json(
    `https://registry.npmjs.org/-/npm/v1/attestations/@squircle-icons%2fsvelte@${version}`,
  );
  const proofs = attestations.attestations.filter((item) => item.predicateType === provenanceType);
  assert.equal(proofs.length, 1, 'Expected one npm provenance statement');
  const statement = JSON.parse(
    Buffer.from(proofs[0].bundle.dsseEnvelope.payload, 'base64').toString(),
  );
  assert.equal(statement.predicateType, provenanceType);
  assert(
    statement.subject.some(
      (subject) =>
        subject.name === `pkg:npm/%40squircle-icons/svelte@${version}` &&
        subject.digest?.sha512 === Buffer.from(integrity.slice(7), 'base64').toString('hex'),
    ),
    'Provenance archive mismatch',
  );
  const build = statement.predicate.buildDefinition;
  assert.deepEqual(
    build.externalParameters.workflow,
    {
      ref: 'refs/heads/main',
      repository: `https://github.com/${repository}`,
      path: '.github/workflows/quality.yml',
    },
    'Unexpected publishing workflow',
  );
  const sources = build.resolvedDependencies.filter(
    (source) => source.uri === `git+https://github.com/${repository}@refs/heads/main`,
  );
  assert.equal(sources.length, 1, 'Expected one publishing source revision');
  const commit = sources[0].digest.gitCommit;
  assert(/^[a-f0-9]{40}$/.test(commit), 'Invalid publishing commit');

  const github = (path, body, missing = false) =>
    json(
      `https://api.github.com/repos/${repository}${path}`,
      {
        method: body ? 'POST' : 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2026-03-10',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
      missing,
    );
  async function checkTag(reference) {
    assert.equal(reference.ref, `refs/tags/${tag}`, 'Unexpected Git tag');
    let target = reference.object;
    for (let depth = 0; target.type === 'tag' && depth < 8; depth++) {
      assert(/^[a-f0-9]{40}$/.test(target.sha), 'Invalid annotated tag reference');
      target = (await github(`/git/tags/${target.sha}`)).object;
    }
    assert.equal(target.type, 'commit', 'Git tag does not resolve to a commit');
    assert.equal(target.sha, commit, 'Existing Git tag points to a different publishing commit');
  }
  let reference = await github(`/git/ref/tags/${tag}`, undefined, true);
  if (reference) await checkTag(reference);
  let release = await github(`/releases/tags/${tag}`, undefined, true);
  if (!release) {
    if (!reference) {
      // Reserve the exact source tag before publishing; never force a conflicting reference.
      reference = await github('/git/refs', { ref: `refs/tags/${tag}`, sha: commit });
      await checkTag(reference);
    }
    release = await github('/releases', {
      tag_name: tag,
      name: version,
      draft: false,
      prerelease,
      make_latest: prerelease ? 'false' : 'legacy',
      body: `Published [@squircle-icons/svelte@${version}](https://www.npmjs.com/package/@squircle-icons/svelte/v/${version}).\n\n\`npm install @squircle-icons/svelte@${version}\`\n\n[Published source](https://github.com/${repository}/commit/${commit}) verified against npm provenance.`,
      generate_release_notes: true,
    });
    await checkTag(await github(`/git/ref/tags/${tag}`));
  } else assert(reference, 'Existing release is missing its Git tag');
  assert.equal(release.tag_name, tag);
  assert.equal(release.name, version, 'Existing release has a different title');
  assert.equal(release.draft, false, 'Existing release is still a draft');
  assert.equal(release.prerelease, prerelease, 'Existing release has a different release type');
  assert.equal(release.html_url, `https://github.com/${repository}/releases/tag/${tag}`);
  return release.html_url;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.env.GITHUB_ACTIONS, 'true');
  assert.equal(process.env.GITHUB_REPOSITORY, repository);
  assert.equal(process.env.GITHUB_REF, 'refs/heads/main');
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(manifest.version, process.env.RELEASE_VERSION);
  const url = await createGitHubRelease({
    manifest,
    integrity: process.env.RELEASE_INTEGRITY,
    token: process.env.GH_TOKEN,
  });
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `GitHub Release: [${manifest.version}](${url})\n`,
    );
  console.log(url);
}
