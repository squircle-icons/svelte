import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { root } from './paths.js';
await mkdir(resolve(root, '.artifacts/bundle'), { recursive: true });
const reports = [];
for (const [name, statement, expectedIcon] of [
  ['bell-static', "import Icon from '@squircle-icons/svelte/bell';", 'Bell.svelte'],
  ['individual', "import Icon from '@squircle-icons/svelte/camera';", 'Camera.svelte'],
  ['folder', "import Icon from '@squircle-icons/svelte/folder';", 'Folder.svelte'],
  ['math', "import Icon from '@squircle-icons/svelte/plus';", 'Plus.svelte'],
  ['square', "import Icon from '@squircle-icons/svelte/plus-square';", 'PlusSquare.svelte'],
  [
    'circle',
    "import Icon from '@squircle-icons/svelte/arrow-left-circle';",
    'ArrowLeftCircle.svelte',
  ],
  ['barrel', "import { Camera as Icon } from '@squircle-icons/svelte';", 'Camera.svelte'],
] as const) {
  const transformedPackageModules = new Set<string>();
  const entry = resolve(root, `.artifacts/bundle/${name}.js`);
  await writeFile(entry, statement + '\nexport default Icon;\n');
  const result = await build({
    configFile: false,
    root,
    plugins: [
      {
        name: 'record-icon-compilation-graph',
        enforce: 'pre',
        transform(_code, id) {
          const file = id.split('?')[0];
          const prefix = resolve(root, 'dist') + '/';
          if (file.startsWith(prefix)) transformedPackageModules.add(file.slice(prefix.length));
        },
      },
      svelte({ configFile: false }),
    ],
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
  const transformedIconModules = [...transformedPackageModules]
    .filter((file) => file.endsWith('.svelte'))
    .sort();
  if (name !== 'barrel') {
    assert.deepEqual(
      transformedIconModules,
      [expectedIcon],
      'Per-icon imports must transform only the selected icon, before tree shaking',
    );
    assert(
      ![...transformedPackageModules].some(
        (file) => file.endsWith('/index.js') || file === 'index.js' || file === 'catalog.json',
      ),
      'Per-icon imports must bypass collection barrels and the catalog',
    );
    assert(
      ![...transformedPackageModules].some((file) =>
        /controller|adapter\.svelte|motion\.(js|ts)|^morph\//.test(file),
      ),
      'Icons must not transform animation runtime',
    );
  }
  {
    assert(
      iconModules.length === 1 && iconModules[0].endsWith('/' + expectedIcon),
      'Unused icon code was retained',
    );
    assert(
      !modules.some((id) => /controller|adapter\.svelte|motion\.(js|ts)|\/dist\/morph\//.test(id)),
      'Static bundle imported motion runtime',
    );
    assert(
      !code.includes('createMotionController') && !code.includes('prefers-reduced-motion'),
      'Static output retained motion code',
    );
  }
  await writeFile(resolve(root, `.artifacts/bundle/${name}.output.js`), code);
  reports.push({
    name,
    bytes: Buffer.byteLength(code),
    transformedIconModules,
    transformedPackageModules: [...transformedPackageModules].sort(),
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
  reports.map(({ name, bytes, transformedIconModules, iconModules, motionRuntime }) => ({
    name,
    bytes,
    transformedIconModules,
    iconModules,
    motionRuntime,
  })),
);
