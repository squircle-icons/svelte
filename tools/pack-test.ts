import { cp, mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { root } from './paths.js';
const artifacts = resolve(root, '.artifacts');
await mkdir(artifacts, { recursive: true });
const run = (args: string[], cwd = root) =>
  execFileSync('pnpm', args, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
run(['build']);
run(['pack', '--pack-destination', artifacts]);
const tarball = resolve(artifacts, 'squircle-icons-svelte-0.0.0.tgz');
const fixture = await mkdtemp(resolve(tmpdir(), 'squircle-consumer-'));
await cp(resolve(root, 'tests/fixture'), fixture, { recursive: true });
const rootPackage = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
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
      dependencies: { 'squircle-icons-svelte': `file:${tarball}` },
      devDependencies,
    },
    null,
    2,
  ),
);
run(['install', '--ignore-workspace', '--ignore-scripts'], fixture);
const installed = await realpath(resolve(fixture, 'node_modules/squircle-icons-svelte'));
assert(!installed.startsWith(root), 'Fixture resolved a workspace link instead of the tarball');
const installedPackage = JSON.parse(await readFile(resolve(installed, 'package.json'), 'utf8'));
assert.equal(installedPackage.license, 'MIT', 'Packed manifest must declare MIT');
assert(!installedPackage.exports['./filled/search'], 'Search must not expose a Filled entry point');
await assert.rejects(readFile(resolve(installed, 'dist/filled/Search.svelte')), { code: 'ENOENT' });
assert(
  !(await readFile(resolve(installed, 'dist/filled/index.js'), 'utf8')).includes('Search.svelte'),
  'Filled barrel retained removed Search',
);
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
  'Filled component import or SSR cutout missing',
);
assert(
  html.includes('Filled camera review') && html.includes('Filled settings review'),
  'New filled exports or declarations did not survive packing',
);
assert(
  html.includes('Already open') && html.includes('scaleY(0.72)'),
  'Initial open pose was not server-rendered',
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
      checked: [
        'tarball installation',
        'declarations',
        'production build',
        'server-rendered open pose',
        'server accessibility',
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(`Packed artifact consumer passed: ${fixture}`);
