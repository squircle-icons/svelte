import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { compile } from 'svelte/compiler';

const manifest = JSON.parse(
  await readFile('node_modules/@squircle-icons/svelte/package.json', 'utf8'),
);
const components = Object.entries(manifest.exports)
  .filter(([, target]) => {
    const resolved = typeof target === 'string' ? target : (target.svelte ?? target.default);
    return typeof resolved === 'string' && resolved.endsWith('.svelte');
  })
  .map(([entry]) => entry);
const entries = ['.', ...components];
const require = createRequire(import.meta.url);
for (const entry of components) {
  const filename = require.resolve('@squircle-icons/svelte' + entry.slice(1));
  const source = await readFile(filename, 'utf8');
  for (const generate of ['client', 'server']) compile(source, { filename, generate });
}
await writeFile(
  'types.ts',
  `import type { ComponentProps } from 'svelte';
${entries
  .map((entry, i) =>
    entry === '.'
      ? `import * as Barrel${i} from '@squircle-icons/svelte${entry.slice(1)}';`
      : `import Icon${i} from '@squircle-icons/svelte${entry.slice(1)}';\nconst props${i}: ComponentProps<typeof Icon${i}> = ${entry.startsWith('./morph/maximize-minimize') ? "{ minimize: true, style: 'filled', progress: 0.5 }" : entry === './motion/trash' ? "{ open: true, style: 'filled', progress: 0.5 }" : entry === './morph/plus-minus' ? "{ minus: true, style: 'filled', progress: 0.5 }" : entry === './morph/plus-x' || entry === './morph/menu-x' ? "{ x: true, style: 'filled', progress: 0.5 }" : entry.startsWith('./morph/') ? "{ moon: true, style: 'filled', progress: 0.5 }" : entry === './heart' || entry === './pen' ? "{ style: 'filled' }" : '{ strokeWidth: 1.5 }'};`,
  )
  .join('\n')}
import Trash from '@squircle-icons/svelte/trash';
const animatedTrash: ComponentProps<typeof Trash> = { animate: true, open: true, style: 'filled', speed: 0.5 };
const staticTrash: ComponentProps<typeof Trash> = { strokeWidth: 'bold' };
// @ts-expect-error Motion uses authored thickness; static weights must not be silently accepted.
const invalidMotionWeight: ComponentProps<typeof Trash> = { animate: true, strokeWidth: 'bold' };
import Camera from '@squircle-icons/svelte/camera';
// @ts-expect-error Only icons with authored motion support animate.
const invalidCameraMotion: ComponentProps<typeof Camera> = { animate: true };
const named: ComponentProps<typeof Camera> = { style: 'filled', strokeWidth: 'bold' };
// @ts-expect-error Invalid preset must stay rejected on older Svelte types.
const invalid: ComponentProps<typeof Camera> = { strokeWidth: 'heavy' };
// @ts-expect-error Named Bold style belongs to the unframed math symbols.
const invalidStyle: ComponentProps<typeof Camera> = { style: 'bold' };
import Heart from '@squircle-icons/svelte/heart';
// @ts-expect-error Authored expanded Outline has no editable centerline.
const invalidHeartWidth: ComponentProps<typeof Heart> = { strokeWidth: 2 };
`,
);

const plugin = (generate) => ({
  name: 'svelte-consumer',
  setup(builder) {
    builder.onLoad({ filter: /\.svelte$/ }, async ({ path }) => ({
      contents: compile(await readFile(path, 'utf8'), { filename: path, generate }).js.code,
      loader: 'js',
    }));
  },
});
await writeFile(
  'server-entry.mjs',
  "import { render } from 'svelte/server'; import App from './App.svelte'; export const html = render(App).body;",
);
await build({
  entryPoints: ['server-entry.mjs'],
  outfile: 'server.mjs',
  bundle: true,
  format: 'esm',
  platform: 'node',
  plugins: [plugin('server')],
});
const { html } = await import('./server.mjs');
assert(html.includes('Compatible camera') && html.includes('server'), 'SSR failed');
await writeFile(
  'index.html',
  `<!doctype html><html><body><main id="app">${html}</main><script type="module" src="/client.js"></script></body></html>`,
);
await writeFile(
  'client-entry.mjs',
  "import { hydrate } from 'svelte'; import App from './App.svelte'; hydrate(App, { target: document.getElementById('app') });",
);
await build({
  entryPoints: ['client-entry.mjs'],
  outfile: 'client.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  plugins: [plugin('client')],
});
console.log(
  `Compiled ${components.length} component exports for client/server on Node ${process.versions.node}`,
);
