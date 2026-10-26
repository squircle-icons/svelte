# Squircle Icons · Svelte

**Alpha stage · Open source · MIT license**

Native Svelte 5 components generated from the versioned [core](https://github.com/squircle-icons/core) artifact. This repository owns Svelte generation, lifecycle handling, package exports, and consumer/bundle/browser tests. Editable SVGs and motion recipes belong in core.

## Install in a Svelte 5 application

```sh
npm install @squircle-icons/svelte@alpha
```

Or use `pnpm add @squircle-icons/svelte@alpha`. The first alpha is `0.1.0-alpha.0`. Installing the package downloads the collection; imports determine which icons your application bundles. Individual static entry points include neither other icon geometry nor motion code.

```svelte
<script lang="ts">
  import Camera from '@squircle-icons/svelte/camera';
  import FilledBell from '@squircle-icons/svelte/filled/bell';
</script>

<Camera size={24} strokeWidth={1.7} label="Camera" />
<FilledBell size={24} label="Notifications" />
```

Six Outline icons and five Filled icons are included. Search is intentionally Outline-only. Svelte 5.57.1+ is required. Animated Folder/Bell entry points remain experimental in this alpha; static design approval does not certify their motion. APIs and artwork may change before a stable release.

## Keep application builds small

Prefer a direct entry point for each icon you use:

```ts
import Bell from '@squircle-icons/svelte/bell';
import FilledBell from '@squircle-icons/svelte/filled/bell';
import AnimatedBell from '@squircle-icons/svelte/animated/bell';
```

Each direct path resolves to that component without traversing a collection barrel or catalog. Static paths transform only the selected icon and no motion modules. Animated Bell transforms its component, Bell recipe and shared motion helpers; it does not traverse other icons or the Folder recipe.

Root named imports such as `import { Camera } from '@squircle-icons/svelte'` remain supported. Production tree shaking removes unused geometry, but a build tool may still transform unused components first. The Vite production regression currently observes six transformed icon components for that root import, compared with one for a direct path. Final bundle size and compilation work are separate checks.

Native `.svelte` files are compiled by the consuming Svelte application, including its client/server targets. The selected component still needs compilation. Copying the same files locally does not remove that work. Package installation downloads the collection into `node_modules`; direct imports keep unused icons outside the application build graph. `pnpm test:bundle` asserts both transformed files and retained modules in `.artifacts/bundle-report.json`. These results describe the tested Vite toolchain, not every possible bundler configuration.

## Develop and verify

Requires Node.js 24.19.0 and pnpm 10.10.0. A reviewed core artifact is included under `vendor/`, so a normal clone and CI run do not require credentials for another repository.

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm pack --pack-destination .artifacts
```

Install browser engines once with `pnpm exec playwright install chromium firefox webkit`. `pnpm verify` checks artifact provenance, deterministic generation, types, package build, unit contracts, retained production bundle modules, an isolated tarball consumer, SSR/hydration, motion lifecycle, reduced motion, and browser geometry baselines.

`src/lib/` contains generated components and a handwritten `adapter.svelte.ts`. Core runtime/types are generated internal copies included in the package; no unpublished core runtime dependency reaches consumers. Static and animated entry points are separate.

```svelte
<script lang="ts">
  import Camera from '@squircle-icons/svelte/camera';
  import Folder from '@squircle-icons/svelte/animated/folder';
  import Bell from '@squircle-icons/svelte/animated/bell';
</script>

<Camera size={24} label="Camera" />
<Folder open />
```

Common props are `size=24`, `color="currentColor"`, `strokeWidth=1.70`, optional `label`, and `class`. Decorative icons omit `label`; meaningful icons receive one accessible name. Animated icons accept opt-in `hover` and `reducedMotion="system" | "always"`. Folder is controlled through `open` and exposes `reset()`; bell exposes `play()` and `reset()` through `bind:this`. Nothing autoplays or loops by default.

## Update core

```sh
pnpm sync:core ../core
```

The source core checkout must be committed and clean. The sync command builds/packs core, records its full commit and artifact hash in `dependency-lock.json`, refreshes the local dependency/lockfile, and regenerates components. Review and commit the artifact, provenance, generated source, and lockfile together. The internal core catalog is not a stable public API.

To update the homepage, commit this repository, then run `pnpm sync:svelte ../svelte` from the homepage checkout. Its users install the built package artifact, not this repository's source files.

The npm package is `@squircle-icons/svelte`; alpha releases use the `alpha` distribution tag. Core is an internal build input included in the artifact, and users install only the Svelte package. Original artwork and code are licensed under [MIT](LICENSE). See [migration provenance](MIGRATION.md).

## Filled style

Five icons have original filled variants. Folder, Camera, Heart and Settings are owner-approved; Bell is also approved after its solid Filled clapper correction; all six static icons have owner approval. Search is owner-approved in Outline only and has no Filled export. Import an individual variant with `import Folder from '@squircle-icons/svelte/filled/folder'` (or the `@squircle-icons/svelte/filled` barrel). It accepts `size`, `color`, `strokeWidth`, `label`, and `class`. For this filled Folder, `strokeWidth` controls the inner divider gap (default 1.70) while the outside remains fill-only and unchanged. The source gap is bounded to 0.25–6 units. `FilledIconProps` is exported from the filled barrel. Its negative-space divider is authored in core and preserved through SVG validation/optimization and packaging. The other four filled variants use fixed solid geometry: strokeWidth has no effect on them. Their counters are intentionally authored in the SVG rather than created by filling Outline paths.

Motion development is paused while the static family is reviewed. Existing animated exports are retained; no new animation behavior is added.
