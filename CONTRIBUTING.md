# Contributing to the Svelte adapter

## Run the release workflow

In the repository's **Actions** tab, select **npm release**. **Run workflow** provides GitHub's branch selector; there is no environment input because the package has one production destination. Choose `main` to publish; selecting another branch runs checks only. Publication uses the restricted GitHub environment named `npm`, matching the trusted publisher already configured on npm.

After the npm job verifies publication and both distribution tags, the GitHub Release job creates a release named after the package version and a `v`-prefixed source tag. npm provenance supplies the original publishing revision, so retries cannot silently tag a newer commit. The job has `contents: write` but no npm OIDC permission. It preserves existing published notes and rejects conflicting tags, titles and drafts instead of overwriting them. No new secret or manual npm approval is needed.

Public post-publication integrity checks read the registry directly, without npm CLI publishing credentials, its metadata cache or presentation format (`npm view --json` in npm 12 returns an array for a single field). A missing version is polled for up to ten minutes while npm processes it; other registry failures are reported immediately. A retry may finish tags for the exact archive already published, without creating another package version.

**Current icon contract:** in this workspace, start with [ICON_RULES.md](../core/ICON_RULES.md). It is the canonical agent playbook for Goal, Rules, Design, Verification, Tests and delivery. Older numerical examples or dated trials below are historical where superseded by that guide; use its current family-specific construction rules.

Change original artwork in core, commit them there, then run `pnpm sync:core ../core`. Never edit generated components, the generated metadata catalog by hand.

The Svelte adapter owns presentation props and accessibility attributes. Static components stay static; morphs use separate opt-in subpaths. Preserve per-icon exports and the unified Outline/Filled style prop.

Follow the [core contour-matching rule](https://github.com/squircle-icons/core/blob/main/DESIGN_RULES.md#outline-and-filled-styles). For new or revised dual-style artwork, compare the actual packed Outline exterior at Regular 1.75 with the Filled exterior and corresponding openings at native proportions, including a rotated pose. Maintain a contour regression check alongside browser-specific visual baselines.

Preserve independent per-icon exports. Direct paths must bypass barrels/catalogs and transform only their selected `.svelte` component. Icon paths must traverse no animation runtime or other icon geometry. `test:bundle` checks the transform graph before tree shaking as well as retained production code. A small final bundle alone does not prove a small compilation graph.

Run `pnpm verify` and inspect browser captures before accepting changes. Visual baselines represent the alpha implementation, not approval of the final style. Contributions to original code and artwork are submitted under the project’s [MIT license](LICENSE).

For the owner-requested Menu/Search Bold Filled treatment, compare packed geometry against Outline at Bold 2.50; these two icons deliberately differ from Regular 1.75 and use no surrounding box.

Preserve compatibility with Svelte 5.0.0 through version 5, Node.js 18.0.0 or later, and npm 8.6.0 or later when npm is used. Packed components must contain JavaScript scripts and separate declarations so older Svelte compilers need no TypeScript preprocessing. Run `pnpm test:compat` after changing generation, public props, package preprocessing or exports. Repository development uses Node 24.19.0; consumer compatibility is checked separately on older Node versions.

## Morph contributions

Before creating or revising a morph, read the [shared agent playbook](../core/MORPH.md)
for Goal, Design, implementation order, Verification, Tests and delivery criteria.
It is the canonical specification; this repository must not maintain a divergent
copy. A named pair request means implement through to a working Lab preview, and
the owner permits questions whenever a material decision is unclear.
