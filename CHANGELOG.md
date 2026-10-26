# Changelog

## 0.1.0-alpha.1

- Add the reviewed Sun and Moon pairs. Drafts from later review batches are excluded from this release.
- Reject colliding/reserved generated names and fall back to Regular for invalid numeric stroke widths.

- Use one direct icon import with `style="outline" | "filled"`; Outline is the default.
- Add `strokeWidth="thin" | "regular" | "bold"`, defaulting to Regular, while retaining custom numeric widths.
- Compare local and package imports with repeatable build/size measurements.

- Remove animated components, runtime, exports, demos and related snapshots. Existing animation imports and props are no longer supported.

## 0.1.0-alpha.0

- First npm alpha under `@squircle-icons/svelte`, licensed MIT.
- Six original reviewed Outline icons: Bell, Camera, Folder, Heart, Search and Settings.
- Five reviewed Filled variants; Search remains Outline-only.
- Native Svelte 5 components, individual entry points, declarations and accessible labels.
- Regular 1.70 with adjustable Outline strokes and a configurable Filled Folder divider.
- Experimental opt-in Folder/Bell animation with reduced-motion support.
- Static bundle isolation and isolated tarball SSR/hydration/browser verification.

Alpha APIs, artwork and experimental motion can change before a stable release.
