# Release audit — 0.1.0-alpha.1

What this repo does: Squircle Icons turns original SVG artwork into native Svelte components. Applications import one icon and choose Outline/Filled and stroke presets. This review assumes a collection growing to 1,000 icons, with applications using a small subset.

## Release scope

The npm release is isolated from parallel artwork work. It contains eight owner-reviewed Outline icons and seven Filled variants: Bell, Camera, Folder, Heart, Moon, Search, Settings and Sun; Search is Outline-only. Later draft batches are excluded. All eight released drawings match the current approved core geometry.

## Fixed findings

1. **Names could crash generation or overwrite components.**
   - What this is: SVG names become component filenames and public exports.
   - Problem: Empty name segments, reserved exports, `camera2`/`camera-2`, and `github`/`git-hub` could fail or overwrite output on macOS.
   - Fix: Validate names and reject reserved, duplicate and case-insensitive filename collisions before writing output. Regression cases pass.
   - If skipped: Adding one source could break or corrupt the generated collection.

2. **Invalid numeric stroke widths reached SVG markup.**
   - What this is: The public numeric/preset stroke API.
   - Problem: NaN, infinity and negative values produced invalid SVG attributes.
   - Fix: Fall back to Regular for invalid numbers; keep valid custom numbers including zero. Tests cover all presets and numeric edges.
   - If skipped: A bad application value could make an icon disappear or render incorrectly.

3. **Failed sync left a partially updated checkout.**
   - What this is: Updating a pinned upstream package artifact.
   - Problem: Files/provenance changed before installation succeeded, and forced installation could remove usable dependencies.
   - Fix: Stage the artifact, use content-addressed filenames and normal installation, roll back affected files/dependencies on failure, preserve the backup if recovery fails, and recheck upstream state after packing.
   - If skipped: A failed sync could leave code, dependency files and installed modules disagreeing. Fault tests cover installation, generation, provenance, recovery failure and upstream changes during packing.

4. **Source validation accepted empty or invalid artwork.**
   - What this is: Core SVG validation, before components are generated.
   - Problem: Named empty groups passed; number coercion accepted non-SVG numeric forms, and numeric cleanup could round precise small geometry away.
   - Fix: Require a shape, validate SVG numbers, preserve source numeric precision, and remove unused old core props types. Core regression tests pass. These are build-time core fixes; the released eight drawings were also compared against current sources.
   - If skipped: Broken future sources could be accepted or changed during optimization.

5. **The publish hook skipped regression checks.**
   - What this is: The default source-publishing lifecycle.
   - Problem: It checked generation/types but did not require bundle, packed-consumer or browser tests.
   - Fix: `prepublishOnly` now runs the complete verification suite. This release publishes the exact already-tested tarball.
   - If skipped: A source publish could pass types while shipping a broken consumer package.

## Final checks

- Deterministic generation, dependency commit/SHA-256, format, TypeScript and Svelte diagnostics: pass.
- Release unit/fault tests: 27 pass.
- Packed-consumer SSR, declarations and production build: pass.
- Chromium, Firefox and WebKit: 33 pass, including style switching, hover/focus, presets, geometry and fixed Filled behavior.
- Direct imports compile only the selected icon; root imports retain only the used icon after tree shaking; no animation runtime is retained.
- npm dependency audit: zero reported vulnerabilities for Svelte and core development dependencies.
- npm publish dry run: pass; 42 allowlisted files, 13,788 bytes compressed. No credentials, source vendor archive or removed animation files are packed.
- `style="filled" strokeWidth="bold"` is accepted. Fixed Filled drawings retain their authored geometry; Filled Folder uses the width for its inner gap. Browser checks and documentation agree.

Verdict: No unresolved release findings in the audited scope. Ready for the alpha tag.

Not checked: Real mobile hardware, bundlers outside the tested Vite/Svelte toolchain, and human approval of later draft artwork. This is not a guarantee that no unknown bugs exist. Homepage is owned by a separate chat and is outside the final publication decision.
