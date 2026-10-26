# Contributing to the Svelte adapter

Change original artwork in core, commit them there, then run `pnpm sync:core ../core`. Never edit generated components, the generated metadata catalog by hand.

The Svelte adapter owns presentation props and accessibility attributes. Components are static. Preserve per-icon exports and the unified Outline/Filled style prop.

Follow the [core contour-matching rule](https://github.com/squircle-icons/core/blob/main/DESIGN_RULES.md#outline-and-filled-styles). For new or revised dual-style artwork, compare the actual packed Outline exterior at Regular 1.70 with the Filled exterior and corresponding openings at native proportions, including a rotated pose. Maintain a contour regression check alongside browser-specific visual baselines.

Preserve independent per-icon exports. Direct paths must bypass barrels/catalogs and transform only their selected `.svelte` component. Icon paths must traverse no animation runtime or other icon geometry. `test:bundle` checks the transform graph before tree shaking as well as retained production code. A small final bundle alone does not prove a small compilation graph.

Run `pnpm verify` and inspect browser captures before accepting changes. Visual baselines represent the alpha implementation, not approval of the final style. Contributions to original code and artwork are submitted under the project’s [MIT license](LICENSE).
