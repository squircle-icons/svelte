import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const svelte = process.env.SVELTE_COMPAT_VERSION || '5.0.0';
const node = process.env.COMPAT_NODE || process.execPath;
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: 'inherit' });
run('pnpm', ['build']);
await mkdir(resolve(root, '.artifacts'), { recursive: true });
run('pnpm', ['pack', '--pack-destination', '.artifacts']);
const tarball = resolve(root, '.artifacts', `squircle-icons-svelte-${manifest.version}.tgz`);
const fixture = await mkdtemp(resolve(tmpdir(), 'squircle-compat-'));
await cp(resolve(root, 'tests/compatibility'), fixture, { recursive: true });
await writeFile(
  resolve(fixture, 'package.json'),
  JSON.stringify(
    {
      name: 'squircle-compat-consumer',
      private: true,
      type: 'module',
      dependencies: { '@squircle-icons/svelte': `file:${tarball}`, svelte },
      devDependencies: { esbuild: manifest.devDependencies.esbuild, typescript: '5.6.3' },
    },
    null,
    2,
  ),
);
const npmArgs = ['install', '--engine-strict', '--ignore-scripts', '--no-audit', '--no-fund'];
const bundledNpm = resolve(dirname(node), '../lib/node_modules/npm/bin/npm-cli.js');
if (existsSync(bundledNpm)) run(node, [bundledNpm, ...npmArgs], fixture);
else run('npm', npmArgs, fixture);
const installed = JSON.parse(
  await readFile(resolve(fixture, 'node_modules/svelte/package.json'), 'utf8'),
);
assert.equal(installed.version, svelte, 'Consumer must use the requested Svelte version');
run(node, ['build.mjs'], fixture);
run(
  node,
  [
    'node_modules/typescript/bin/tsc',
    '--noEmit',
    '--strict',
    '--module',
    'nodenext',
    '--target',
    'es2022',
    'types.ts',
  ],
  fixture,
);
const server = createServer(async (request, response) => {
  const filename = request.url === '/client.js' ? 'client.js' : 'index.html';
  try {
    const body = await readFile(resolve(fixture, filename));
    response.setHeader('Content-Type', filename.endsWith('.js') ? 'text/javascript' : 'text/html');
    response.end(body);
  } catch (error) {
    response.statusCode = 500;
    response.end(String(error));
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || /hydration.*mismatch/i.test(message.text()))
      errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('#ready').filter({ hasText: 'hydrated' }).waitFor();
  const camera = page.locator('#camera svg');
  assert.equal(await camera.getAttribute('aria-label'), 'Compatible camera');
  assert.equal(await camera.getAttribute('stroke-width'), '1.75');
  await page.locator('#preset').click();
  await page.waitForFunction(
    () => document.querySelector('#camera svg').getAttribute('stroke-width') === '2.5',
  );
  assert.equal(await page.locator('#folder svg').getAttribute('data-cutout-width'), '2.5');
  await page.locator('#number').click();
  await page.waitForFunction(
    () => document.querySelector('#camera svg').getAttribute('stroke-width') === '1.5',
  );
  assert.equal(await page.locator('#folder svg').getAttribute('data-cutout-width'), '1.5');
  await camera.evaluate((svg) => {
    window.originalCamera = svg;
  });
  await page.locator('#style').click();
  await page.waitForFunction(
    () => document.querySelector('#camera svg').getAttribute('stroke') === 'none',
  );
  assert(
    await camera.evaluate((svg) => window.originalCamera === svg),
    'Style switch replaced the SVG',
  );
  assert.deepEqual(
    await page
      .locator('#camera path')
      .evaluateAll((paths) => paths.map((p) => p.getAttribute('d'))),
    await page
      .locator('#dedicated path')
      .evaluateAll((paths) => paths.map((p) => p.getAttribute('d'))),
  );
  assert.equal(await page.locator('#dedicated svg').getAttribute('aria-hidden'), 'true');
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
const nodeVersion = execFileSync(node, ['--version'], { encoding: 'utf8' }).trim();
const report = {
  svelte,
  node: nodeVersion,
  fixture,
  checks: [
    'all component client/server compilation',
    'packed declarations with TypeScript 5.6',
    'SSR',
    'hydration',
    'style switching',
    'numeric/preset widths',
    'Filled geometry',
    'accessibility',
  ],
};
await writeFile(
  resolve(root, '.artifacts', `compatibility-${svelte}-${nodeVersion}.json`),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(`Compatibility passed: Svelte ${svelte}, Node ${nodeVersion}`);
