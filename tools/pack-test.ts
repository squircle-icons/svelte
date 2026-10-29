import { cp, mkdir, mkdtemp, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { root } from './paths.js';
const artifacts = resolve(root, '.artifacts');
const rootPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await mkdir(artifacts, { recursive: true });
const run = (args: string[], cwd = root) =>
  execFileSync('pnpm', args, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
run(['build']);
run(['pack', '--pack-destination', artifacts]);
const tarball = resolve(
  artifacts,
  `${rootPackage.name.replace(/^@/, '').replace('/', '-')}-${rootPackage.version}.tgz`,
);
const fixture = await mkdtemp(resolve(tmpdir(), 'squircle-consumer-'));
await cp(resolve(root, 'tests/fixture'), fixture, { recursive: true });
const devDependencies = Object.fromEntries(
  [
    'svelte',
    '@sveltejs/kit',
    '@sveltejs/adapter-static',
    '@sveltejs/vite-plugin-svelte',
    'vite',
    'typescript',
    'svelte-check',
    '@types/node',
  ].map((name) => [name, rootPackage.devDependencies[name]]),
);
await writeFile(
  resolve(fixture, 'package.json'),
  JSON.stringify(
    {
      name: 'packed-squircle-consumer',
      private: true,
      type: 'module',
      packageManager: rootPackage.packageManager,
      dependencies: { '@squircle-icons/svelte': `file:${tarball}` },
      devDependencies,
    },
    null,
    2,
  ),
);
run(['install', '--ignore-workspace', '--ignore-scripts'], fixture);
const installed = await realpath(resolve(fixture, 'node_modules/@squircle-icons/svelte'));
assert(!installed.startsWith(root), 'Fixture resolved a workspace link instead of the tarball');
const installedPackage = JSON.parse(await readFile(resolve(installed, 'package.json'), 'utf8'));
assert.equal(installedPackage.name, '@squircle-icons/svelte');
assert.equal(installedPackage.version, rootPackage.version);
const consumerRequire = createRequire(resolve(fixture, 'package.json'));
const studyFilename = consumerRequire.resolve('@squircle-icons/svelte/design/squircle-base');
assert(
  studyFilename.startsWith(installed),
  'Design helper did not resolve from the installed tarball',
);
const study = await import(studyFilename);
assert.equal(study.STUDY_STROKE, 1.5, 'Packed study must use its scoped new-design weight');
assert.equal(study.DEFAULT_ROUNDNESS, 3.2);
assert(study.squircleStudy().outline.includes('C'), 'Packed whole-contour study is missing');
assert(!study.squircleStudy().outline.includes('L'), 'Study must not substitute straight sides');
const studySource = await readFile(studyFilename, 'utf8');
assert(
  !studySource.includes('@squircle-icons/core'),
  'Design helper leaked a Core runtime dependency',
);
assert(!Object.hasOwn(installedPackage.dependencies ?? {}, '@squircle-icons/core'));
for (const subject of ['square', 'camera', 'folder']) {
  const shape = study.prototypeStudy(subject);
  assert.deepEqual(study.prototypeStudy(subject), shape, `Nondeterministic ${subject} study`);
  for (const style of ['outline', 'filled']) {
    const path = shape[style];
    assert(typeof path === 'string' && path.startsWith('M'), `Missing ${subject} ${style}`);
    assert(!/NaN|Infinity|undefined/.test(path), `Invalid ${subject} ${style} coordinates`);
    assert.notEqual(
      study.prototypeStudy(subject, 2.7)[style],
      study.prototypeStudy(subject, 4)[style],
    );
  }
}
assert(!installedPackage.private, 'Release package must permit publication');
assert.equal(installedPackage.publishConfig.access, 'public');
assert.equal(installedPackage.publishConfig.tag, 'alpha');
assert.equal(installedPackage.license, 'MIT', 'Packed manifest must declare MIT');
assert(
  !Object.keys(installedPackage.exports).some((path) => /^\.\/filled(?:\/|$)/.test(path)),
  'Removed Filled-only exports must not survive packing',
);
for (const path of ['@squircle-icons/svelte/filled', '@squircle-icons/svelte/filled/search'])
  assert.throws(() => consumerRequire.resolve(path), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
await assert.rejects(stat(resolve(installed, 'dist/filled')), { code: 'ENOENT' });
assert(
  (await readFile(resolve(installed, 'dist/Search.svelte'), 'utf8')).includes('evenodd'),
  'Unified Search must retain its Filled compound cutout',
);
assert(
  !Object.keys(installedPackage.exports).some((path) => path.includes('animated')),
  'Removed animation exports must not survive packing',
);
await assert.rejects(readFile(resolve(installed, 'dist/animated/Bell.svelte')), { code: 'ENOENT' });
await assert.rejects(readFile(resolve(installed, 'dist/adapter.svelte.js')), { code: 'ENOENT' });
const installedLicense = await readFile(resolve(installed, 'LICENSE'), 'utf8');
assert(installedLicense.includes('Copyright (c) 2026 palamto'), 'Packed copyright notice missing');
assert(installedLicense.includes('Permission is hereby granted'), 'Packed MIT terms missing');
assert(
  !JSON.stringify(installedPackage.dependencies ?? {}).includes('workspace:'),
  'Leaked workspace dependency',
);
run(['exec', 'svelte-kit', 'sync'], fixture);
run(['exec', 'svelte-check', '--tsconfig', './tsconfig.json'], fixture);
run(['exec', 'vite', 'build'], fixture);
const html = await readFile(resolve(fixture, 'build/index.html'), 'utf8');
assert(
  html.includes('Filled folder') && html.includes('fill-rule="evenodd"'),
  'Unified Filled rendering or SSR cutout missing',
);
assert(
  html.includes('Filled camera review') && html.includes('Filled settings review'),
  'Unified Filled components or declarations did not survive packing',
);
assert(
  [
    'Outline Sun contour',
    'Filled Sun contour',
    'Outline Moon contour',
    'Filled Moon contour',
  ].every((label) => html.includes(label)),
  'Sun and Moon direct exports did not survive packing',
);
assert(
  html.includes('Camera one') && html.includes('aria-hidden="true"'),
  'Server accessibility markup is missing',
);
await writeFile(
  resolve(artifacts, 'fixture-location.json'),
  JSON.stringify(
    {
      fixture,
      tarball,
      installed,
      checked: ['tarball installation', 'declarations', 'production build', 'server accessibility'],
    },
    null,
    2,
  ) + '\n',
);
console.log(`Packed artifact consumer passed: ${fixture}`);
