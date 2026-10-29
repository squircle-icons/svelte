import { cp, mkdir, mkdtemp, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises';
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
assert.equal(installedPackage.license, 'MIT');
assert.equal(installedPackage.publishConfig.access, 'public');
assert.equal(installedPackage.publishConfig.tag, 'alpha');
assert(!Object.hasOwn(installedPackage.dependencies ?? {}, '@squircle-icons/core'));
for (const path of [
  'filled',
  'filled/search',
  'plus-square',
  'arrow-left-circle',
  'log-in',
  'design/squircle-base',
  'design/window-transfer',
]) {
  assert.throws(() => consumerRequire.resolve('@squircle-icons/svelte/' + path), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
  });
}
for (const path of [
  'filled',
  'PlusSquare.svelte',
  'ArrowLeftCircle.svelte',
  'design/squircle-base.js',
  'design/window-transfer.js',
]) {
  await assert.rejects(stat(resolve(installed, 'dist', path)), { code: 'ENOENT' });
}
assert(
  !(await readdir(resolve(installed, 'dist'))).includes('LogIn.svelte'),
  'Legacy casing survived packing',
);
const catalog = JSON.parse(await readFile(resolve(installed, 'dist/catalog.json'), 'utf8'));
assert.equal(catalog.icons.length, 94);
const source = await import(consumerRequire.resolve('@squircle-icons/svelte/design/figma-catalog'));
assert.deepEqual(
  catalog.icons.map((icon: { name: string }) => icon.name).sort(),
  source.FIGMA_STUDY_ICONS.map((icon: { id: string }) => icon.id).sort(),
);
const license = await readFile(resolve(installed, 'LICENSE'), 'utf8');
assert(license.includes('Permission is hereby granted'));
run(['exec', 'svelte-kit', 'sync'], fixture);
run(['exec', 'svelte-check', '--tsconfig', './tsconfig.json'], fixture);
run(['exec', 'vite', 'build'], fixture);
const html = await readFile(resolve(fixture, 'build/index.html'), 'utf8');
assert(
  html.includes('Camera one') && html.includes('aria-hidden="true"'),
  'Missing server accessibility markup',
);
assert(
  html.includes('data-motion="trash"') && html.includes('data-morph="sun-moon"'),
  'SSR omitted current motion/morph',
);
assert(
  html.includes('data-icon="shopping-bag"') && html.includes('data-icon="image"'),
  'SSR omitted new source identities',
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
