# Release audit — 0.1.0-alpha.2

What this repo does: Squircle Icons validates original SVG artwork in core and generates native Svelte icon components. Applications import individual icons and select Outline/Filled and stroke widths. This audit assumes a growing collection of 1,000 icons, with each application using a small subset.

## Scope and preservation

- Compatibility was merged into main alongside the latest committed icon work. The merge preserved the existing generated icon geometry, catalogs and pinned source artifact before the audited fixes.
- The release includes all 20 owner-approved Outline/Filled pairs, including Download, Upload and the final approved Moon orientation. Approval comes from the owner's recorded source metadata, not from passing tests.
- Core source: commit 4fb1db90cd47d4389d08c9e91d8ff03e899afa32. This commit corrects the current README; it does not alter the approved SVGs.
- Core remains a private development dependency and is not published to npm. The Svelte package has no regular runtime dependencies; Svelte is a peer dependency.
- The homepage's uncommitted visual redesign is separately owned. It is not included in the npm package or this publication verdict. Its package documentation and public dependency are updated separately after publication.

## Must fix — resolved

1. **The oldest supported Svelte compiler could reject packed TypeScript.** (svelte.config.js; tests/compatibility/)
   - What this is: Svelte 5.0.0 must compile the distributed component source.
   - Problem: Compiling the previous packed source reproduced Not implemented type annotation EmptyStatement. Simply lowering the peer range would not make that source work.
   - Fix: Preprocess component scripts to JavaScript during packaging, retaining separate TypeScript declarations. Every one of the 40 component exports compiles for client and server on Svelte 5.0.0 / Node 18.0.0 / npm 8.6.0.
   - If skipped: Older consumers would install successfully and then fail during compilation.

2. **Whitespace-only labels created unnamed images.** (tools/generate.ts; tests/browser/icons.spec.ts)
   - What this is: Accessible names for unified and dedicated Filled components.
   - Problem: Camera with label containing three spaces produced role=img and a whitespace aria-label in actual server output.
   - Fix: Trim labels in the shared generator. Empty labels produce decorative SVGs. The existing SSR/hydration browser test now checks both import forms across Chromium, Firefox and WebKit.
   - If skipped: Screen readers could encounter images with no meaningful accessible name.

3. **Tarball publishing omitted the npm page README.** (release workflow)
   - What this is: The documentation shown on npm, separate from README bytes inside a downloaded archive.
   - Problem: The public registry returned an empty root README after the earlier tarball publication. Packing a README file alone did not populate publication metadata.
   - Fix: Publish from a frozen, extracted copy of the verified payload using npm's directory manifest preparation, which reads README metadata. Assert that this metadata exactly matches README.md. Lifecycle scripts are skipped only for that frozen artifact because the complete source checks have already run; the published artifact contains no development tools. Compare every file with the tested tarball before publication.
   - If skipped: Users could download the documentation but still see an empty npm documentation page.

## Should fix — resolved

4. **The publish hook allowed incomplete verification.** (package.json)
   - What this is: The source package's default publication gate.
   - Problem: The old hook checked provenance, generation and types but skipped unit, bundle, tarball and browser regression checks.
   - Fix: prepublishOnly now runs the complete verification suite. Verification includes a packed Svelte 5.0.0 compatibility consumer. CI runs the exact minimum and recommended consumer Node versions while package tooling remains on the development Node version.
   - If skipped: A publish could pass types while shipping a regression only caught in a real consumer.

5. **Release and artwork documentation described obsolete states.** (README.md; CHANGELOG.md; core/README.md)
   - What this is: Public compatibility, artwork availability and release history.
   - Problem: Main still reported alpha.0, lacked the alpha.1 changelog, and core's README described historical six/thirteen-icon approvals and an obsolete boxed Search.
   - Fix: Set alpha.2, restore alpha.1 history from its release tag, describe all 20 current approved pairs, retain the latest artwork exceptions, and keep Recommended separate from the one deepest-tested older combination.
   - If skipped: Users could choose the wrong runtime, miss newly available icons, or mistake historical design experiments for the current approved source.

## Verification

- Core: complete verification passed; 67 unit cases, source validation, types and build.
- Svelte: complete verification passed; 28 unit/fault cases and 141 browser cases across Chromium, Firefox and WebKit. Packed-consumer SSR, hydration, public declarations, production build, style switching, presets, numeric widths and geometry checks pass.
- Exact minimum: Svelte 5.0.0, Node 18.0.0, bundled npm 8.6.0. Strict installation, all 40 client/server component compilations, TypeScript 5.6 declarations and Chromium hydration/interaction pass.
- Recommended test combination: Svelte 5.57.2, Node 22.23.4 LTS, bundled npm 10.9.9. The same compatibility checks pass. Documentation recommends version ranges rather than exact patches.
- Per-icon imports compile only the selected component and bypass the catalog/barrels. Root named imports retain only the selected icon after tree shaking. No animation runtime is retained. Local and package imports produce equivalent executable code.
- Core and Svelte dependency audits report zero known vulnerabilities in their installed development dependency sets. This does not assert that every old consumer runtime is maintained or vulnerability-free.
- The package contains 92 allowlisted files, 20 approved icons with both styles, no animation exports and no regular dependencies. Package scripts contain JavaScript; declarations remain available.
- npm prepared README metadata: 7,618 characters, matching the packed README exactly. The npm-packed payload is byte-identical to all 92 files in the tarball used by the verification consumers.
- Prepared npm archive: 24933 bytes. Integrity: sha512-0DGTAHsZZtC/dME1mVO7vwjlC4IHDnoIUbz1eziNXji3u2PDoTD8UV/9ubgePI6ip0gg5TbtloQI2QGXiU9KxA==.

Verdict: No unresolved release findings in the audited core/Svelte scope. Ready for alpha.2 publication.

Not checked: Real mobile hardware, native Windows/Linux consumer execution, bundlers outside the tested Vite/esbuild toolchain, Svelte 4/6, or every future runtime combination. Older Node 18/20 support records compatibility; the recommended maintained LTS setup is for new applications. The separately edited homepage's visual redesign is outside this npm release audit.
