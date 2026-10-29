# Contributing to the Svelte adapter

Read Core's [ICON_RULES.md](../core/ICON_RULES.md) and [MORPH.md](../core/MORPH.md). Change original artwork in Core, verify/commit it, then run `pnpm sync:core ../core`. Do not edit generated component geometry or catalogs manually.

Generate one component per current identity with Outline/Filled, independent direct imports and no legacy frame variants, Filled namespace or prototype datasets. Preserve exact source paint, path coordinates, transforms and draft status. Default Outline uses1.5; only real stroked geometry supports configurable widths. Heart/Pen retain expanded Outlines. Animation thickness stays fixed.

Keep direct imports independent of barrels, catalogs and unrelated geometry. Ordinary icons load no animation runtime. Unified Trash may load only its authored renderer/data and the shared controller; static mode mounts no animation lifecycle. Keep the current motion geometry/timing and five opt-in morphs. Preserve Animate/Morph page separation in the local Lab.

Run `pnpm verify` and inspect actual packed browser output. New logic needs meaningful checks; removing old APIs requires replacing their obsolete checks with current source parity and removed-export assertions. Never update visual baselines to conceal a defect. Svelte 5.0.0 through version 5 and the package's declared Node/npm minimums must remain tested in CI. Packed components contain JavaScript plus separate declarations, with no Core runtime dependency.

Sync requires a committed clean source and exclusive destination ownership. After verifying/committing Svelte, run `pnpm sync:svelte ../svelte` in the private Lab and verify it. Keep Homepage on its separately verified published npm pin; do not replace it with a local artifact.

The npm release workflow verifies main, installs the tested archive in compatibility consumers, and publishes through OIDC only after all required jobs pass. It verifies registry contents/tags before creating the version-named GitHub Release. Never overwrite a published version. Alpha may preserve explicitly authorized draft artwork; stable requires approved source. See [README.md](README.md) for usage and [MIGRATION.md](MIGRATION.md) for removed APIs.
