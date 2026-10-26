# Squircle Icons · Svelte

**Alpha stage · Open source · MIT license**

Native Svelte 5 components generated from the versioned [core](https://github.com/squircle-icons/core) artwork. This repository owns component generation, props, package exports, and consumer/bundle/browser tests.

## Install in a Svelte 5 application

```sh
npm install @squircle-icons/svelte@alpha
```

Release `0.1.0-alpha.2` contains all 20 owner-reviewed icons in both Outline and Filled styles. It includes the latest approved artwork and the compatibility requirements below. Earlier published versions retain their original contents and requirements.

### Recommended

- Svelte 5.0.0+ within version 5 (`>=5.0.0 <6`).
- Node.js 22+ from a maintained LTS release line.
- npm 10+, including newer major releases when their Node.js requirements are met. A compatible pnpm version is an alternative.

Use an up-to-date patch and the [official Node.js LTS download](https://nodejs.org/en/download). Your Node.js version must meet the requirements of the npm release you choose. The recommendation does not require an exact patch or the newest Current release.

### Tested older versions

This is the minimum supported combination verified by the packed-package compatibility check:

| Svelte | Node.js | Bundled npm |
| ------ | ------- | ----------- |
| 5.0.0  | 18.0.0  | 8.6.0       |

The check covers installation, client/server compilation of every component export, public TypeScript declarations, SSR, Chromium hydration, style switching, numeric/preset widths, Filled geometry and accessibility. The table records tested combinations; it does not claim that every version combination or application build tool has been tested.

This source supports Svelte `>=5.0.0 <6` and Node.js `>=18.0.0`, subject to your application's build-tool requirements. When installing with npm, use npm `>=8.6.0`; a compatible pnpm version is an alternative. Svelte 4 is not supported. Node.js 18 and 20 are end-of-life and are tested for existing projects. Use the recommended maintained Node.js 22 LTS setup for new applications.

The package ships JavaScript inside its native `.svelte` components and separate TypeScript declarations. Consumers do not need a TypeScript preprocessor for the icons. Building this repository itself uses the newer development tools listed below.

```svelte
<script lang="ts">
  import Camera from '@squircle-icons/svelte/camera';
</script>

<Camera size={24} label="Camera" />
<Camera size={24} label="Camera" style="filled" />
<Camera strokeWidth="thin" />
<Camera strokeWidth="regular" />
<Camera strokeWidth="bold" />
```

Use the same import for both styles. `style="outline"` is the default; `style="filled"` selects the separately authored solid drawing. Menu and Search provide fixed Bold 2.25 Filled geometry without an enclosing box, following their Outline centerlines. Dedicated imports such as `@squircle-icons/svelte/filled/camera` and the Filled barrel remain supported.

Common props are `size=24`, `color="currentColor"`, `style="outline"`, `strokeWidth="regular"`, optional `label` and `class`. Decorative icons omit `label`; meaningful icons receive one accessible name. Components add no tab stop or duplicate SVG title. Stroke presets are `thin` (1.25), `regular` (1.70), and `bold` (2.25); numbers remain supported for fine adjustments. Filled Folder uses `strokeWidth` for its bounded 0.25–6-unit divider gap; other Filled drawings have fixed geometry.

Animation components, runtime, recipes and exports have been removed from the current source. The API has no `animate`, `hover`, `open`, or `reducedMotion` props and no playback methods.

## Keep application builds small

Use one direct import per icon and choose its style through props:

```svelte
<script lang="ts">
  import Camera from '@squircle-icons/svelte/camera';
  let active = $state(false);
</script>

<Camera style={active ? 'filled' : 'outline'} strokeWidth="regular" />
```

The component contains only that icon's available styles. It bypasses other icons, collection barrels and the catalog. It keeps one root SVG while the style changes. Let the parent button manage hover and keyboard focus; no special hover prop or animation runtime is needed. Legacy `/filled/<icon>` paths remain compatible, while documentation and website previews use the unified API.

Root named imports such as `import { Camera } from '@squircle-icons/svelte'` remain supported. Production tree shaking removes unused components, although a build tool may compile them first. Copying an unchanged component into your app produces the same executable JavaScript as its direct package import. `pnpm test:imports` checks this, confirms one compiled icon, and records repeated build timings and gzip/Brotli sizes in `.artifacts/import-benchmark/report.json`. Timing is informational.

Native `.svelte` files are compiled by the consuming application for its client/server targets. `pnpm test:bundle` records transformed and retained modules in `.artifacts/bundle-report.json`; these checks describe the tested Vite toolchain.

## Develop and verify

Requires Node.js 24.19.0 and pnpm 10.10.0. The reviewed core artifact in `vendor/` makes builds independent of sibling checkouts.

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm pack --pack-destination .artifacts
```

Install browser engines once with `pnpm exec playwright install chromium firefox webkit`. Verification checks artifact provenance, deterministic generation, types, build, source contracts, bundle isolation, an isolated tarball consumer, SSR/hydration, style switching, and browser geometry baselines.

Generated components in `src/lib/` must be changed through `tools/generate.ts`. Public component props live in `src/lib/props.ts`. Consumers need no core runtime dependency.

`pnpm test:compat` installs the packed artifact with Svelte 5.0.0 in a separate consumer. It compiles every component export for client/server, checks the public declarations with TypeScript 5.6, and tests SSR, browser hydration, style switching, numeric/preset widths, Filled geometry and accessibility. `SVELTE_COMPAT_VERSION` selects another exact Svelte version; `COMPAT_NODE` selects the Node executable used for compilation, SSR and type checking, plus its bundled npm when available. The test runner and package build still use the development Node version.

The compatibility CI matrix checks the minimum setup above and the recommended Svelte 5.57.2 / Node 22.23.4 consumer. The full development suite checks Svelte 5.57.2 on Node 24.19.0 in Chromium, Firefox and WebKit.

## Update core and homepage

```sh
# After committing core:
pnpm sync:core ../core

# After committing this repository, run from homepage:
pnpm sync:svelte ../svelte
```

Sync requires a committed, clean upstream checkout and exclusive use of the downstream checkout while it runs. It builds and packs the source, records its full commit and SHA-256 in `dependency-lock.json`, refreshes the installed dependency and lockfile, and regenerates components/catalogs. Artifacts use content-addressed filenames so updates do not require a destructive reinstall. Failed installation, generation or provenance checks restore downstream files and the previously installed dependency. If automatic recovery also fails, the error prints the preserved backup location. Review the artifact, provenance and generated output together.

The public package is `@squircle-icons/svelte`; alpha releases use the `alpha` distribution tag. Original artwork and code are licensed under [MIT](LICENSE). See [migration provenance](MIGRATION.md).
