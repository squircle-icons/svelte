import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { withRollback } from './sync-rollback.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(process.argv[2] ?? '../core');
const run = (args, cwd = source) =>
  execFileSync('pnpm', args, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
const git = (...args) => execFileSync('git', args, { cwd: source, encoding: 'utf8' }).trim();
const manifest = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'));
assert.equal(manifest.name, '@squircle-icons/core', 'Unexpected source package');
assert.equal(git('status', '--porcelain'), '', 'Commit the source repository before syncing');
const commit = git('rev-parse', 'HEAD');
run(['verify']);
assert.equal(git('rev-parse', 'HEAD'), commit, 'Source commit changed during verification');
assert.equal(git('status', '--porcelain'), '', 'Source files changed during verification');

const staging = await mkdtemp(resolve(tmpdir(), 'squircle-core-pack-'));
try {
  run(['pack', '--pack-destination', staging]);
  assert.equal(git('rev-parse', 'HEAD'), commit, 'Source commit changed during packing');
  assert.equal(git('status', '--porcelain'), '', 'Source files changed during packing');
  const packed = resolve(staging, `squircle-icons-core-${manifest.version}.tgz`);
  const sha256 = createHash('sha256')
    .update(await readFile(packed))
    .digest('hex');
  const artifact = `vendor/squircle-icons-core-${manifest.version}-${sha256.slice(0, 12)}.tgz`;
  const previous = JSON.parse(await readFile(resolve(root, 'dependency-lock.json'), 'utf8'));
  await withRollback(
    root,
    ['package.json', 'pnpm-lock.yaml', 'dependency-lock.json', 'vendor', 'src/lib'],
    async () => {
      await mkdir(resolve(root, 'vendor'), { recursive: true });
      await copyFile(packed, resolve(root, artifact));
      await copyFile(
        resolve(source, 'dist/catalog.json'),
        resolve(root, 'vendor/core-catalog.json'),
      );
      const target = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
      target.devDependencies['@squircle-icons/core'] = `file:${artifact}`;
      await writeFile(resolve(root, 'package.json'), JSON.stringify(target, null, 2) + '\n');
      run(['install', '--no-frozen-lockfile'], root);
      run(['generate'], root);
      await writeFile(
        resolve(root, 'dependency-lock.json'),
        JSON.stringify(
          {
            repository: 'https://github.com/squircle-icons/core',
            commit,
            version: manifest.version,
            artifact,
            sha256,
          },
          null,
          2,
        ) + '\n',
      );
      run(['dependency:check'], root);
      if (previous.artifact !== artifact && /^vendor\/[^/]+\.tgz$/.test(previous.artifact))
        await rm(resolve(root, previous.artifact), { force: true });
    },
    async () => run(['install', '--offline', '--frozen-lockfile'], root),
  );
  console.log(
    `Synced core at ${commit}. Review and commit the artifact, generated files, lockfile, and provenance together.`,
  );
} finally {
  await rm(staging, { recursive: true, force: true });
}
