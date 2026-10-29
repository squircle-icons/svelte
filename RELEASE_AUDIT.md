# Release audit — 0.2.0-alpha.0

What this repo does: generates native Svelte components from the current 94 source pairs, plus Trash animation and five reversible morphs. Expected use is applications importing a small subset; direct import graphs must stay independent as the collection grows.

## Resolved findings

1. **Production exports still used legacy artwork.** The old 121/frame collection and superseded prototype datasets were separate from the current Lab source. Core now builds from the same 94 source pairs; Svelte generates exactly those identities. Removed exports/files are checked in an installed tarball.
2. **Old static Trash differed from its animation endpoint.** Both now read the same current source, preserving the authored motion geometry/timing. Plain mode mounts no motion lifecycle; animated thickness stays fixed and declarations reject unsupported weights.
3. **Obsolete clipping IDs would be duplicated across instances.** Source validation accepts only the actual full-viewport clip rectangles, verifies references and replaces these redundant clips with root viewport clipping. Path coordinates, paint, transforms and counters remain unchanged; every pair is raster-compared against literal source.
4. **Legacy approval and documentation rules disagreed with the requested alpha.** Draft statuses are preserved. Alpha release validation accepts known approved/draft statuses and complete unique pairs; stable releases reject drafts. This records the owner's explicit publication request without inventing visual approval.
5. **File casing differed between the working tree and Git.** Login replaces LogIn; exact directory-entry checks validate packed casing, two-step Git renames fix the tracked names, and generate:check now catches tracked casing mismatches locally before CI. Removed export resolution remains rejected.

## Verification

- Core full checks passed: source hashes, safe SVG/XML, finite geometry, 101 unit cases, types, deterministic catalog and clean build. No current source SVG path or visual review status was edited.
- Svelte full checks passed: formatting, artifact provenance, deterministic generation, types, 29 unit cases, npm/GitHub release regression checks, seven bundle cases, repeated Camera import benchmark, installed-tarball SSR consumer and Svelte 5.0.0 compatibility. All 100 component exports compile for client/server; fixed Outline and animated-weight declarations are checked.
- Chromium/Firefox/WebKit: 165 cases passed. All 94 pairs match literal source paint in both styles; 188 components render at 16/20/24/48px. Coverage includes accessibility, style/width changes, exact morph endpoints, approved merge timing, reversal, reduced motion, pause/resume, unmount cleanup and Trash static lifecycle isolation. Removed geometry/frame tests were replaced with current-source parity tests; no old screenshot baseline was relabeled as new approval.
- Ordinary per-icon imports compile only their selected icon and no animation runtime. Trash includes only its own renderer/data and the shared controller. Barrel imports retain only the requested component after tree shaking.
- The GitHub npm release workflow and its archive-integrity/provenance/tag checks are retained. Publication and GitHub Release are permitted only after quality and compatibility jobs pass.
- The private Lab's retired archives, old prototype routes/data and stale screenshots were removed at the owner's request. The active 94-pair Lab and Animate/Morph pages remain the preview surface; the updated private Lab passed its full checks, including 8 unit and 120 browser cases. Registry results follow publication handoff.

Verdict: local source and package checks pass. The private Lab passed all checks; remaining gates are GitHub quality/compatibility checks before npm publication. Stable design approval remains separate.

Not checked: hardware performance, synthetic thousand-icon load, Svelte 4/6, every third-party bundler or a new public Homepage deployment. Public npm contents/tags/GitHub Release must be verified after publication; successful local tests do not imply publication.
