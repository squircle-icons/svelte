# Squircle Icons · Svelte

**Alpha stage · Open source · MIT license**

Native Svelte 5 components generated from the versioned [core](https://github.com/squircle-icons/core) artwork. This repository owns component generation, props, package exports, and consumer/bundle/browser tests.

## Install in a Svelte 5 application

```sh
npm install @squircle-icons/svelte@alpha
```

Release `0.1.0-alpha.4` contains 121 owner-reviewed static icons from 51 authoring families, including 35 Square and 35 Circle drawings. Every static icon has Outline and Filled styles. It includes the latest approved artwork and the compatibility requirements below. Earlier published versions retain their original contents and requirements.

### Recommended

- Svelte 5.0.0+ within version 5 (`>=5.0.0 <6`).
- Node.js 22+ from a maintained LTS release line.
- npm 10+, including newer major releases when their Node.js requirements are met. A compatible pnpm version is an alternative.

Use an up-to-date patch and the [official Node.js LTS download](https://nodejs.org/en/download). Your Node.js version must meet the requirements of the npm release you choose. The recommendation does not require an exact patch or the newest Current release.

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

Use the same import for both styles. `style="outline"` is the default; `style="filled"` selects the separately authored solid drawing. Menu and Search provide fixed Bold 2.50 Filled geometry without an enclosing box, following their Outline centerlines. Static icons expose one unified component per identity; the separate Filled import namespace has been removed. See [migration instructions](MIGRATION.md#unified-static-imports).

Common props are `size=24`, `color="currentColor"`, `style="outline"`, `strokeWidth="regular"`, optional `label` and `class`. Decorative icons omit `label`; meaningful icons receive one accessible name. Components add no tab stop or duplicate SVG title. Stroke presets are `thin` (1.25), `regular` (1.75), and `bold` (2.50); numbers remain supported for fine adjustments. Filled Folder uses `strokeWidth` for its bounded 0.25–6-unit divider gap; other Filled drawings have fixed geometry.

The old animated Folder/Bell API remains removed. Static icons have no `animate`, `hover`, `open`, or playback methods. Authored morph pairs use separate opt-in imports described below.

## Keep application builds small

Use one direct import per icon and choose its style through props:

```svelte
<script lang="ts">
  import Camera from '@squircle-icons/svelte/camera';
  let active = $state(false);
</script>

<Camera style={active ? 'filled' : 'outline'} strokeWidth="regular" />
```

The component contains only that icon's available styles. It bypasses other icons, collection barrels and the catalog. It keeps one root SVG while the style changes. Let the parent button manage hover and keyboard focus; no special hover prop or animation runtime is needed. The same unified API is used for Filled previews and consumer examples.

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

The compatibility CI matrix checks the minimum versions declared in package metadata and a recommended Node 22 LTS consumer. The full development suite checks Svelte 5.57.2 on Node 24.19.0 in Chromium, Firefox and WebKit.

## Update core and local review app

```sh
# After committing core:
pnpm sync:core ../core

# After committing this repository, run from repos/lab:
pnpm sync:svelte ../svelte
```

Sync requires a committed, clean upstream checkout and exclusive use of the downstream checkout while it runs. It builds and packs the source, records its full commit and SHA-256 in `dependency-lock.json`, refreshes the installed dependency and lockfile, and regenerates components/catalogs. Artifacts use content-addressed filenames so updates do not require a destructive reinstall. Failed installation, generation or provenance checks restore downstream files and the previously installed dependency. If automatic recovery also fails, the error prints the preserved backup location. Review the artifact, provenance and generated output together.

The public package is `@squircle-icons/svelte`. Keep both `alpha` and `latest` distribution tags on the current release so the default npm page, default install and documented `@alpha` command stay in sync. Update the public homepage from the exact published npm version and its registry provenance; the independent local app keeps its separate development artifact. Original artwork and code are licensed under [MIT](LICENSE). See [migration provenance](MIGRATION.md).

## Static frames and Bold

Frames are separate icons with independent imports. Static components have no `frame` prop:

```svelte
<script>
  import Plus from '@squircle-icons/svelte/plus';
  import PlusSquare from '@squircle-icons/svelte/plus-square';
  import PlusCircle from '@squircle-icons/svelte/plus-circle';
</script>

<Plus />
<Plus style="bold" />
<PlusSquare style="filled" />
<PlusCircle style="outline" />
```

Only unframed Plus, Minus and X expose `style="bold"`, fixed at 2.50. Other icons select Outline or Filled; Outline thickness still supports presets and numbers. Unframed math Filled equals its solid Bold mark. Its Square/Circle Filled drawings use a Regular 1.75 cutout. Frames are available only where separately authored; Maximize, Minimize and External Link have no framed variants. New Tab uses `plus-square` rather than a duplicate export.

## Opt-in morph pairs

```svelte
<script>
  import SunMoonMorph from '@squircle-icons/svelte/morph/sun-moon';
  let dark = $state(false);
</script>

<button onclick={() => (dark = !dark)} aria-pressed={dark} aria-label="Dark mode">
  <SunMoonMorph moon={dark} size={24} />
</button>
```

Bind the destination prop to the state your application already uses. The host application owns theme changes, persistence and interaction. Keep the same component mounted to reverse smoothly in flight.

| Import suffix             | Destination prop | Motion status                               |
| ------------------------- | ---------------- | ------------------------------------------- |
| `morph/sun-moon`          | `moon`           | Owner-preferred reference; experimental     |
| `morph/plus-x`            | `x`              | Approved horizontal-merge motion; 0.4× pace |
| `morph/menu-x`            | `x`              | Experimental horizontal merge; 0.6× pace    |
| `morph/plus-minus`        | `minus`          | Experimental single fold; 0.6× pace         |
| `morph/maximize-minimize` | `minimize`       | Experimental inward corner fold; 0.6× pace  |

All pairs support `style="outline|filled"`, `size`, `color`, `class`, `label`, `speed`, `progress`, `onprogress` and `onsettle`. Omit `progress` for animation; a supplied 0–1 value controls manual inspection instead. Morph weights follow their authored endpoints and have no `strokeWidth` prop. Reversal preserves progress and velocity, hidden documents pause playback, and reduced motion switches immediately. Static imports never load this runtime.

All five morphs use the current Figma Squircle endpoints at Outline1.5, with each source's authored Filled treatment. They are unframed and have no `frame` or `strokeWidth` prop. Maximize Minimize uses the inward cubic fold; the temporary separate study export is removed. Static endpoint approval is separate from motion approval; experimental morphs remain subject to change.

## Opt-in icon Motion

Motion animates one icon. It has its own `/motion` page, separate from Morph’s
icon-to-icon pairs at `/morph`.

`TrashMotion` from `motion/trash` moves the current Trash lid and handle together,
keeping its body and slots fixed. Set `open={true}` to lift the lid and `false` to
close; use the same shared props and reversible progress behavior above. Its
closed contour matches the current Figma Trash in both styles. The local preview
is `/motion/trash`; motion approval is pending owner review.

Public releases run `pnpm release:check` after verification to reject unapproved static artwork in any style or frame. Local `pnpm pack` remains available for draft review without publishing.
