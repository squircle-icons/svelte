import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { root } from './paths.js';
await mkdir(resolve(root, '.artifacts/bundle'), { recursive: true });
const reports = [];
for (const [name, statement] of [
  ['individual', "import Camera from 'squircle-icons-svelte/camera';"],
  ['barrel', "import { Camera } from 'squircle-icons-svelte';"],
  ['animated', "import Camera from 'squircle-icons-svelte/animated/bell';"],
] as const) {
  const entry = resolve(root, `.artifacts/bundle/${name}.js`);
  await writeFile(entry, statement + '\nexport default Camera;\n');
  const result = await build({
    configFile: false,
    root,
    plugins: [svelte({ configFile: false })],
    logLevel: 'error',
    build: { write: false, minify: false, lib: { entry, formats: ['es'] } },
  });
  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.flatMap((output) => {
    assert('output' in output);
    return output.output.filter((chunk) => chunk.type === 'chunk');
  });
  const code = chunks.map((chunk) => chunk.code).join('\n');
  const modules = chunks.flatMap((chunk) =>
    Object.entries(chunk.modules)
      .filter(([, info]) => info.renderedLength > 0)
      .map(([id]) => id),
  );
  const iconModules = modules.filter((id) => /dist\/.*\.svelte$/.test(id));
  if (name !== 'animated') {
    assert(
      iconModules.length === 1 && iconModules[0].endsWith('/Camera.svelte'),
      'Unused icon code was retained',
    );
    assert(
      !modules.some((id) => /controller|adapter\.svelte|motion\.(js|ts)/.test(id)),
      'Static bundle imported motion runtime',
    );
    assert(
      !code.includes('createMotionController') && !code.includes('prefers-reduced-motion'),
      'Static output retained motion code',
    );
  } else
    assert(
      modules.some((id) => id.includes('/controller.js')),
      'Animated control did not include the controller',
    );
  await writeFile(resolve(root, `.artifacts/bundle/${name}.output.js`), code);
  reports.push({
    name,
    bytes: Buffer.byteLength(code),
    iconModules: iconModules.map((id) => id.split('/dist/')[1]),
    motionRuntime: modules.some((id) => id.includes('/controller.js')),
    modules,
  });
}
await writeFile(
  resolve(root, '.artifacts/bundle-report.json'),
  JSON.stringify(reports, null, 2) + '\n',
);
console.log(
  reports.map(({ name, bytes, iconModules, motionRuntime }) => ({
    name,
    bytes,
    iconModules,
    motionRuntime,
  })),
);
