import { it, expect } from 'vitest';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const project = fileURLToPath(new URL('../../', import.meta.url));
for (const failure of [
  'install',
  'generate',
  'dependency:check',
  'recovery',
  'source-changed',
  'none',
])
  it(`sync ${failure === 'none' ? 'commits a verified artifact' : `restores the checkout after ${failure} fails`}`, async () => {
    const directory = await mkdtemp(resolve(tmpdir(), 'squircle-sync-test-'));
    try {
      const consumer = resolve(directory, 'consumer');
      const source = resolve(directory, 'core');
      const bin = resolve(directory, 'bin');
      await mkdir(resolve(consumer, 'tools'), { recursive: true });
      await mkdir(resolve(consumer, 'vendor'), { recursive: true });
      await mkdir(resolve(consumer, 'src/lib'), { recursive: true });
      await mkdir(resolve(consumer, 'node_modules'), { recursive: true });
      await mkdir(resolve(source, 'dist'), { recursive: true });
      await mkdir(bin);
      for (const file of ['sync-core.mjs', 'sync-rollback.mjs'])
        await cp(resolve(project, 'tools', file), resolve(consumer, 'tools', file));
      await writeFile(
        resolve(source, 'package.json'),
        JSON.stringify({ name: '@squircle-icons/core', version: '0.0.0' }),
      );
      await writeFile(resolve(source, 'dist/catalog.json'), '["new"]\n');
      const originalPackage = JSON.stringify({
        devDependencies: { '@squircle-icons/core': 'file:vendor/old.tgz' },
      });
      const originalLock = JSON.stringify({ artifact: 'vendor/old.tgz', commit: 'old' });
      await writeFile(resolve(consumer, 'package.json'), originalPackage);
      await writeFile(resolve(consumer, 'pnpm-lock.yaml'), 'old-lock');
      await writeFile(resolve(consumer, 'dependency-lock.json'), originalLock);
      await writeFile(resolve(consumer, 'vendor/old.tgz'), 'old-artifact');
      await writeFile(resolve(consumer, 'vendor/core-catalog.json'), '["old"]\n');
      await writeFile(resolve(consumer, 'src/lib/Old.svelte'), 'old-source');
      await writeFile(resolve(consumer, 'node_modules/installed.txt'), 'file:vendor/old.tgz');
      await writeFile(
        resolve(bin, 'git'),
        `#!/usr/bin/env node\nconst fs=require('node:fs'),path=require('node:path');\nconsole.log(process.argv[2] === 'rev-parse' ? '${'a'.repeat(40)}' : fs.existsSync(path.join(process.cwd(),'dirty.flag')) ? '?? dirty.flag' : '');\n`,
      );
      await writeFile(
        resolve(bin, 'pnpm'),
        `#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path');
const args = process.argv.slice(2), root = process.cwd(), command = args[0];
if (args.includes('--force')) throw Error('Destructive reinstall');
if (command === 'pack') { fs.writeFileSync(path.join(args[args.indexOf('--pack-destination') + 1], 'squircle-icons-core-0.0.0.tgz'), 'new-artifact'); if (process.env.SYNC_TEST_FAILURE === 'source-changed') fs.writeFileSync(path.join(root,'dirty.flag'),'changed'); }
if (command === 'install') {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  fs.mkdirSync(path.join(root, 'node_modules'), { recursive: true });
  fs.writeFileSync(path.join(root, 'node_modules/installed.txt'), manifest.devDependencies['@squircle-icons/core']);
  fs.writeFileSync(path.join(root, 'pnpm-lock.yaml'), args.includes('--offline') ? 'old-lock' : 'new-lock');
}
if (command === 'generate') {
  fs.writeFileSync(path.join(root, 'src/lib/Old.svelte'), 'new-source');
  fs.writeFileSync(path.join(root, 'src/lib/New.svelte'), 'new-source');
}
if (command === process.env.SYNC_TEST_FAILURE && !args.includes('--offline')) process.exit(42);
if (process.env.SYNC_TEST_FAILURE === 'recovery' && (command === 'generate' || args.includes('--offline'))) process.exit(42);
`,
      );
      for (const file of ['git', 'pnpm']) await chmod(resolve(bin, file), 0o755);
      const result = spawnSync(
        process.execPath,
        [resolve(consumer, 'tools/sync-core.mjs'), source],
        {
          cwd: consumer,
          encoding: 'utf8',
          env: { ...process.env, PATH: bin + ':' + process.env.PATH, SYNC_TEST_FAILURE: failure },
        },
      );
      if (failure !== 'none') {
        expect(result.status, result.stderr).not.toBe(0);
        if (failure === 'recovery') {
          const backup = result.stderr.match(/backup preserved at ([^\n]+)/)?.[1];
          expect(backup, result.stderr).toBeDefined();
          expect(await readFile(resolve(backup!, 'src/lib/Old.svelte'), 'utf8')).toBe('old-source');
          expect(await readFile(resolve(backup!, 'vendor/old.tgz'), 'utf8')).toBe('old-artifact');
          await rm(backup!, { recursive: true, force: true });
        }
        expect(await readFile(resolve(consumer, 'package.json'), 'utf8')).toBe(originalPackage);
        expect(await readFile(resolve(consumer, 'dependency-lock.json'), 'utf8')).toBe(
          originalLock,
        );
        expect(await readFile(resolve(consumer, 'pnpm-lock.yaml'), 'utf8')).toBe('old-lock');
        expect(await readFile(resolve(consumer, 'src/lib/Old.svelte'), 'utf8')).toBe('old-source');
        expect(await readdir(resolve(consumer, 'src/lib'))).toEqual(['Old.svelte']);
        expect(await readdir(resolve(consumer, 'vendor'))).toEqual([
          'core-catalog.json',
          'old.tgz',
        ]);
        expect(await readFile(resolve(consumer, 'node_modules/installed.txt'), 'utf8')).toBe(
          'file:vendor/old.tgz',
        );
      } else {
        expect(result.status, result.stderr).toBe(0);
        const lock = JSON.parse(await readFile(resolve(consumer, 'dependency-lock.json'), 'utf8'));
        expect(lock.commit).toBe('a'.repeat(40));
        expect(lock.sha256).toBe(createHash('sha256').update('new-artifact').digest('hex'));
        expect(lock.artifact).toMatch(/^vendor\/squircle-icons-core-0\.0\.0-[a-f0-9]{12}\.tgz$/);
        expect(await readFile(resolve(consumer, 'node_modules/installed.txt'), 'utf8')).toBe(
          'file:' + lock.artifact,
        );
        expect(await readdir(resolve(consumer, 'vendor'))).not.toContain('old.tgz');
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
