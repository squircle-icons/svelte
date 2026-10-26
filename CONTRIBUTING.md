# Contributing to the Svelte adapter

Change original artwork and recipes in core, commit them there, then run `pnpm sync:core ../core`. Never edit generated components, generated internal core copies, or the generated metadata catalog by hand.

The Svelte adapter owns lifecycle and media-query listeners. Core alone owns motion styles on designated parts after mount; Svelte owns geometry, presentation, and accessibility attributes. Keep static imports independent of animation code and preserve per-icon exports.

Follow the [core contour-matching rule](https://github.com/squircle-icons/core/blob/main/DESIGN_RULES.md#outline-and-filled-styles). For new or revised dual-style artwork, compare the actual packed Outline exterior at Regular 1.70 with the Filled exterior and corresponding openings at native proportions, including a rotated pose. Maintain a contour regression check alongside browser-specific visual baselines.

Run `pnpm verify` and inspect browser captures before accepting changes. Visual baselines represent the alpha implementation, not approval of the final style. Contributions to original code and artwork are submitted under the project’s [MIT license](LICENSE).
