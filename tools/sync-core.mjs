import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(process.argv[2] ?? '../core');
const run = (args, cwd = source) =>
  execFileSync('pnpm', args, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
const manifest = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'));
assert.equal(manifest.name, '@squircle-icons/core', 'Unexpected source package');
assert.equal(
  execFileSync('git', ['status', '--porcelain'], { cwd: source, encoding: 'utf8' }).trim(),
  '',
  'Commit the source repository before syncing',
);
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim();
run(['verify']);
run(['build']);
const vendor = resolve(root, 'vendor');
await mkdir(vendor, { recursive: true });
run(['pack', '--pack-destination', vendor]);
const artifact = `vendor/squircle-icons-core-${manifest.version}.tgz`;
const sha256 = createHash('sha256')
  .update(await readFile(resolve(root, artifact)))
  .digest('hex');
await copyFile(resolve(source, 'dist/catalog.json'), resolve(vendor, 'core-catalog.json'));
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
const target = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
target.devDependencies['@squircle-icons/core'] = `file:${artifact}`;
await writeFile(resolve(root, 'package.json'), JSON.stringify(target, null, 2) + '\n');
run(['install', '--force', '--no-frozen-lockfile'], root);
run(['generate'], root);
run(['dependency:check'], root);
console.log(
  `Synced core at ${commit}. Review and commit the artifact, generated files, lockfile, and provenance together.`,
);
