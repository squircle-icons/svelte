# Squircle Icons · Svelte

**Alpha · Open source · MIT**

Native Svelte 5 components for the current **94 icons**, each with Outline and Filled. Version **0.2.0-alpha.0** replaces the legacy 121 collection and enclosing-frame variants. It includes Trash animation and five reversible morph pairs. Draft visual statuses remain drafts; an alpha release does not grant design approval.

## Install

```sh
npm install @squircle-icons/svelte@alpha
```

Recommended: **Svelte 5.0.0+ within version 5, Node 22+ LTS and npm 10+** (or compatible pnpm). Use maintained patches; npm's own Node requirements also apply. Package declarations support Svelte 5.0.0, Node 18.0.0 and npm 8.6.0 consumers; development uses Node 24.19.0 and pnpm 10.10.0.

```svelte
<script>
  import Camera from '@squircle-icons/svelte/camera';
</script>

<Camera size={24} label="Camera" />
<Camera style="filled" />
<Camera strokeWidth="bold" />
<Camera strokeWidth={1.75} color="rebeccapurple" />
```

One component contains both authored styles. Outline is the default. Props: `size`, `color`, `style="outline|filled"`, `label`, `class`, and `strokeWidth` on real stroked Outlines. Presets are Thin 1.25, Regular 1.5 (default) and Bold 2.5; finite nonnegative numbers are supported. Filled keeps its authored paint/counters and fixed weight. Heart/Pen use expanded Outline geometry and do not expose an adjustable stroke. Labels name meaningful images; omitted/blank labels make icons decorative.

## Small imports

Prefer direct paths such as `@squircle-icons/svelte/camera`. They compile only that icon; other icons and the full metadata/catalog do not enter their graph. `import { Camera } from '@squircle-icons/svelte'` also works, but a bundler may compile the barrel before removing unused exports. Installing the collection on disk is different from bundling it into your app.

Ordinary per-icon imports contain no animation runtime. Trash explicitly includes its own renderer/controller so the same component supports SSR and immediate animation. Static Trash mounts no animation listeners or frames. No asynchronous loading placeholder is required. Bundle checks inspect transformed and retained modules, not only the final byte count.

Choose style from your own hover/focus/selection state:

```svelte
<Camera style={active ? 'filled' : 'outline'} />
```

## Animate on the same component

```svelte
<script>
  import Trash from '@squircle-icons/svelte/trash';
  let open = $state(false);
</script>

<button onclick={() => (open = !open)} aria-label="Toggle trash lid" aria-pressed={open}>
  <Trash animate {open} style="filled" size={24} />
</button>
```

`animate` defaults to false. Keep it enabled and change `open` to reverse smoothly in flight. Static and animated Trash use the same current source; the body/slots remain fixed while lid/handle move together. Animated thickness is authored and fixed, so do not pass `strokeWidth` with `animate`. Only Trash currently has authored animation. The explicit `motion/trash` entry also remains available.

Motion props include `speed`, controlled `progress` (0..1), `onprogress` and `onsettle`, plus common visual/accessibility props. Reduced motion selects endpoints directly; hidden tabs pause and unmounting cleans up. Animation remains experimental pending owner review.

## Morph between icons

```svelte
<script>
  import SunMoonMorph from '@squircle-icons/svelte/morph/sun-moon';
  let dark = $state(false);
</script>

<button onclick={() => (dark = !dark)} aria-label="Dark theme" aria-pressed={dark}>
  <SunMoonMorph moon={dark} style="outline" />
</button>
```

Your app owns the theme change and persistence. Keep the component mounted for smooth reversal.

| Import                    | Destination prop |
| ------------------------- | ---------------- |
| `morph/sun-moon`          | `moon`           |
| `morph/plus-x`            | `x`              |
| `morph/menu-x`            | `x`              |
| `morph/plus-minus`        | `minus`          |
| `morph/maximize-minimize` | `minimize`       |

All five use current source endpoints, support Outline/Filled and the common motion props, and have fixed authored thickness. Plus↔X retains its approved horizontal merge at0.4× pace; other experimental motion statuses are documented in Core's [playbook](https://github.com/squircle-icons/core/blob/main/MORPH.md). Animate and Morph remain separate features/pages in the private local Lab.

## Develop, verify and release

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm release:check
```

Install browser engines once with `pnpm exec playwright install chromium firefox webkit`. Verification covers source provenance, deterministic generation, types, safe geometry, real tarball installation, every source pair, SSR/hydration, accessibility, reversals, lifecycle, reduced motion, import isolation and Svelte 5.0.0 compatibility. Tests grant no visual approval.

Edit artwork in Core, commit and verify it, then run `pnpm sync:core ../core`. Generated components must change through `tools/generate.ts`. Commit the adapter before syncing the independent private Lab with `pnpm sync:svelte ../svelte`. Preserve exclusive pipeline ownership during sync.

GitHub's **npm release** workflow verifies main and compatibility consumers, publishes the tested archive through npm Trusted Publishing/OIDC, verifies registry integrity, aligns `alpha`/`latest`, then creates a GitHub Release named after the version. Publication uses no stored npm token and no repeated local OTP flow. A new version is required for changed published contents. Stable releases require approved artwork; this explicitly authorized alpha preserves draft statuses.

See [migration](MIGRATION.md), [changelog](CHANGELOG.md) and [MIT license](LICENSE). Core is a build-time artifact, not a runtime dependency.
