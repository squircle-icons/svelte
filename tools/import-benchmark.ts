import assert from 'node:assert/strict';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { root } from './paths.js';

const directory = resolve(root, '.artifacts/import-benchmark');
const cases = [
  ['package', "import Icon from '@squircle-icons/svelte/camera';"],
  ['local', "import Icon from './Camera.svelte';"],
] as const;
const samples = 8;
const warmups = 2;
await mkdir(directory, { recursive: true });
await copyFile(resolve(root, 'dist/Camera.svelte'), resolve(directory, 'Camera.svelte'));
await copyFile(resolve(root, 'dist/stroke-width.js'), resolve(directory, 'stroke-width.js'));
for (const [name, statement] of cases)
  await writeFile(resolve(directory, `${name}.js`), statement + '\nexport default Icon;\n');

const reports = [];
for (const externalRuntime of [false, true]) {
  const measurements = new Map<string, { times: number[]; code: string; components: number }>();
  for (let round = 0; round < warmups + samples; round++) {
    // Alternate order so package imports do not always pay the first-build cost.
    for (const [name] of round % 2 ? [...cases].reverse() : cases) {
      let components = 0;
      const started = performance.now();
      const result = await build({
        configFile: false,
        root,
        plugins: [
          {
            name: 'count-benchmark-components',
            enforce: 'pre',
            transform(_code, id) {
              if (id.split('?')[0].endsWith('.svelte')) components++;
            },
          },
          svelte({ configFile: false }),
        ],
        logLevel: 'silent',
        build: {
          write: false,
          minify: true,
          lib: { entry: resolve(directory, `${name}.js`), formats: ['es'] },
          rollupOptions: {
            external: externalRuntime ? (id) => id === 'svelte' || id.startsWith('svelte/') : [],
          },
        },
      });
      const elapsed = performance.now() - started;
      const outputs = Array.isArray(result) ? result : [result];
      const code = outputs
        .flatMap((output) => {
          assert('output' in output);
          return output.output.filter((chunk) => chunk.type === 'chunk').map((chunk) => chunk.code);
        })
        .join('\n');
      const measurement = measurements.get(name) ?? { times: [], code, components };
      if (round >= warmups) measurement.times.push(elapsed);
      measurements.set(name, measurement);
      assert.equal(components, 1, 'Each import must compile exactly one icon');
    }
  }
  // Source-path comments vary with file location; executable code must match.
  const executable = (name: string) => measurements.get(name)!.code.replace(/^\/\/[^\n]*\n/gm, '');
  assert.ok(executable('package') === executable('local'), 'Local and package JS differ');
  for (const [name, measurement] of measurements) {
    const sorted = measurement.times.sort((a, b) => a - b);
    reports.push({
      name,
      externalRuntime,
      components: measurement.components,
      bytes: Buffer.byteLength(measurement.code),
      gzipBytes: gzipSync(measurement.code).length,
      brotliBytes: brotliCompressSync(measurement.code).length,
      medianMs: Number(((sorted[3] + sorted[4]) / 2).toFixed(2)),
      minMs: Number(sorted[0].toFixed(2)),
      maxMs: Number(sorted.at(-1)!.toFixed(2)),
    });
  }
}
await writeFile(
  resolve(directory, 'report.json'),
  JSON.stringify({ node: process.version, samples, warmups, reports }, null, 2) + '\n',
);
console.table(reports);
