# Squircle Icons · Svelte

**Alpha stage · Open source · MIT license**

Native Svelte 5 components generated from the versioned [core](https://github.com/squircle-icons/core) artifact. This repository owns Svelte generation, lifecycle handling, package exports, and consumer/bundle/browser tests. Editable SVGs and motion recipes belong in core.

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
  import Camera from 'squircle-icons-svelte/camera';
  import Folder from 'squircle-icons-svelte/animated/folder';
  import Bell from 'squircle-icons-svelte/animated/bell';
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

The package name `squircle-icons-svelte` is provisional and **not published to npm**. `private: true` and the publication guard remain enabled. Original artwork and code are licensed under [MIT](LICENSE). See [migration provenance](MIGRATION.md).

## Filled style

Folder is the first original filled review candidate, imported with `import Folder from 'squircle-icons-svelte/filled/folder'` (or the `squircle-icons-svelte/filled` barrel). It accepts `size`, `color`, `strokeWidth`, `label`, and `class`. For this filled Folder, `strokeWidth` controls the inner divider gap (default 1.70) while the outside remains fill-only and unchanged. The source gap is bounded to 0.25–6 units. `FilledIconProps` is exported from the filled barrel. Its negative-space divider is authored in core and preserved through SVG validation/optimization and packaging. Other filled icons are not implemented yet.

Motion development is paused while the static family is reviewed. Existing animated exports are retained; no new animation behavior is added.
