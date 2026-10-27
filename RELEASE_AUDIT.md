# Main integration and release audit — 0.1.0-alpha.4

What this repo does: Core validates original SVG artwork and builds framework-independent geometry. Svelte generates distributable components. The homepage shows the released collection and documentation. This audit assumes a growing collection, applications importing a small subset, and a public static website with no server database or user accounts. The current measured collection has 121 static icons from 51 authoring families; no claim is made that a 1,000-icon gallery was load-tested.

## Scope

All local branches in core, Svelte and homepage are ancestors of main. Integration preserved newer source artwork when older branches contained superseded work. Core main 093f6d923e12e734c970050a4888ef392fe0e139 is pinned by the adapter with a SHA-256-checked artifact. The core merge changed no artwork relative to the previously current main. The standalone private Lab is a separate local app and was preserved.

Reviewed flows include SVG/XML input validation, geometry and metadata validation, generated names and exports, source artifact verification and rollback, public props and declarations, pack contents, SSR/hydration, animation lifecycle, theme persistence, gallery filters and pagination, SVG serialization and clipboard/download failures. Build, dependency and CI configuration were reviewed. No runtime dependency was added.

## Must fix — resolved

1. **Ordinary icons accepted an unsupported Bold style** (`repos/svelte/tools/generate.ts`).
   - **What this is:** Component style declarations and stroke resolution.
   - **Problem:** Every unframed icon accepted `style="bold"` although the shared contract allows that style only on Plus, Minus and X. A Camera consumer could compile an unsupported API.
   - **Fix:** Generate that option from `supportsBold`, rather than the absence of a frame. Compatibility declaration checks accept Plus Bold and reject Camera and Plus Square Bold.
   - **If we skip it:** Documentation, declarations and the approved static design contract disagree.

2. **Unreviewed static drawings could reach a public release** (`repos/svelte/tools/release-check.ts`, `package.json`).
   - **What this is:** The final publication gate.
   - **Problem:** Local review packs intentionally include drafts, so a successful local pack alone did not establish public-release approval.
   - **Fix:** The publish hook runs full verification and then rejects empty collections or unapproved Outline/Filled drawings in every exported frame. Four focused regression cases cover this gate; all 121 current static icons pass.
   - **If we skip it:** A later local draft could be published by mistake. Motion approval remains separately documented; experimental opt-in morphs are not relabeled as approved.

3. **The larger collection overflowed smaller screens** (`repos/homepage/src/routes/icons/+page.svelte`).
   - **What this is:** Gallery labels and the detail controls.
   - **Problem:** Long framed icon names forced grid columns wider than their space. At intermediate mobile widths four detail-control columns also exceeded the card width.
   - **Fix:** Constrain the grid column, allow labels to wrap and switch controls to two columns at the affected breakpoint. Desktop/mobile containment and centered icon checks pass in all three browsers.
   - **If we skip it:** The released gallery can require horizontal scrolling and misalign its icon buttons.

## Should fix — resolved

4. **Homepage documentation pulled in the whole catalog** (`repos/homepage/tools/generate-catalog.ts`, `src/routes/docs/+page.svelte`).
   - **What this is:** Generated website metadata and the documentation count/weight display.
   - **Problem:** Documentation only needs a count and weights. Importing a component catalog brings needless icon references; generated browser data also included authoring history text that visitors do not use.
   - **Fix:** Generate a metadata-only count/weights module and project public catalogs to the fields displayed by the website. Keep the full pinned vendor catalog for provenance.
   - **If we skip it:** Collection growth adds avoidable browser data and compile work to a documentation page.

5. **Consumer coverage did not exercise the new release boundaries** (`repos/svelte/tools/bundle-test.ts`, `tools/compatibility-test.mjs`, `tests/compatibility/App.svelte`; homepage browser tests).
   - **What this is:** Regression coverage for separate frames, opt-in morphs and a multi-page gallery.
   - **Problem:** A small single-page collection and fixed morph progress could pass while later frame imports pulled siblings, a morph target failed to change, or Filled items on later gallery pages rendered incorrectly.
   - **Fix:** Check seven bundle cases, explicitly reject morph modules from static imports, compile all 247 component exports for both client and server, toggle all five morphs in both directions and visit every gallery page. Browser assertions wait for rendered layout rather than reading it before Svelte commits the update.
   - **If we skip it:** Import isolation and new collection behavior can regress without a failing test.

6. **Release documentation described the previous collection** (`repos/core/README.md`, `repos/svelte/README.md`, `CHANGELOG.md`, homepage docs/design notes).
   - **What this is:** Installation guidance, icon availability and public API descriptions.
   - **Problem:** Older text described 20 icons, old weights and obsolete animated APIs. It did not explain separate static frame imports or distinguish experimental motion approval.
   - **Fix:** Document 121 static icons, Thin 1.25 / Regular 1.75 / Bold 2.50, static frame imports, supported Bold styles and five opt-in morph pairs. The requested Recommended section remains; Tested older versions is not restored.
   - **If we skip it:** Users copy stale examples and expect behavior that this release does not provide.

## Verification evidence

- Core full verification: source validation, types, 120 unit cases and build passed.
- Svelte full verification: formatting, artifact provenance, deterministic generation, types, 41 unit/fault cases, seven isolated bundle cases, repeated import benchmark, packed consumer, compatibility consumer and 411 browser cases passed.
- Exact old consumer: Svelte 5.0.0 / Node 18.0.0 / npm 8.6.0. All 247 component exports compile for client and server; TypeScript 5.6, SSR/hydration, styles, numeric/preset widths and all five reversible morph targets pass.
- Recommended consumer tested: Svelte 5.57.2 / Node 22.23.4 / npm 10.9.9. The same consumer checks pass. Public recommendations use version ranges.
- Direct static imports compile and retain one icon, with no sibling frame or morph runtime. Root Camera imports compile the 121-icon barrel but retain only Camera. Timing measurements are machine-specific, not a universal speed guarantee.
- With Svelte runtime externalized, the Camera benchmark is 2,045 gzip bytes; a local copy is 2,040. The dedicated Filled example is 1,450. Installing the full collection on disk does not put the collection into each application's browser bundle.
- Pre-release homepage verification against the tested alpha.4 runtime: format, dependency provenance, deterministic generation, types, unit checks, production build and 120 browser cases passed. Chromium, Firefox and WebKit cover mobile/desktop, all 121 gallery entries across pagination, filtering, details, SVG export, clipboard denial, theme storage/reversal and reduced motion.
- npm dependency advisory checks returned zero known vulnerabilities in all three installed dependency sets on 2026-10-27. This is a database result, not proof of absence of every vulnerability.
- The frozen tested tarball contains 530 files and is 119,731 bytes. Only dist, README, LICENSE and the package manifest ship. Core is private and stays a development artifact; no regular runtime dependencies are declared by the Svelte package.
- Release transport and the final registry-backed homepage verification are recorded in the accompanying release logs once publication finishes. Publication and hosted deployment are not inferred from test success.

Verdict: No unresolved findings in the audited main source and pre-release package. Ready for the authorized alpha.4 publication; final registry and homepage checks must follow it.

Not checked: Real mobile hardware, native Windows/Linux consumer execution, Svelte 4/6, every third-party bundler, large synthetic collections, external hosting deployment, or a fresh audit of the standalone private Lab. Tests do not grant visual or motion approval. The package remains alpha and documented experimental morph APIs can change.
