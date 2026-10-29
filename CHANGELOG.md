# Changelog

## Unreleased

- Add `<Trash animate open={open} />` to the existing Trash import, reusing the authored motion. Plain Trash keeps its static artwork and stroke widths; animated thickness is fixed. The Trash bundle includes its motion renderer/controller, while other direct icon imports stay isolated.

- Breaking: remove the separate Filled import namespace and Filled-only component tree. Use the regular per-icon import with `style="filled"` instead.
- Keep both authored styles, numeric/preset stroke widths and independent per-icon compilation in the unified components.

## 0.1.0-alpha.4

- Include all 121 approved static icons from 51 authoring families, with independent Square/Circle imports and no static frame prop.
- Set Regular to 1.75 and Bold to 2.50. Preserve Thin 1.25 and numeric widths. Unframed Plus/Minus/X support an explicit Bold style; their unframed Filled is a solid mark.
- Add five opt-in morph pairs. Plus X retains its approved continuous horizontal merge; the other pairs retain their documented experimental status.
- Block unapproved static artwork at publication, preserve independent icon compilation, and expand packed/compatibility coverage for separate frame exports.
- Keep Svelte 5.0.0 through version 5 and the declared Node/npm consumer minimums.

## 0.1.0-alpha.3

- Remove the Tested older versions section from the public README; keep the Recommended version ranges. Compatibility metadata and automated checks remain unchanged.
- Clarify the independent homepage Lab update and keep the npm default/latest and alpha release aliases aligned.

## 0.1.0-alpha.2

- Expand the release from eight icons to all twenty owner-approved Outline/Filled pairs. Add Arrow Left/Right, Check, Chevron Up/Down, Copy, Download, Menu, Plus, Trash, Upload and X; Search now has a Filled export.
- Include the latest reviewed artwork. Menu/Search Filled follows fixed Bold 2.25 geometry, and Moon's approved minus-30-degree pose is baked into its native zero-degree source.
- Support Svelte 5.0.0 through version 5 and consumer Node.js 18.0.0 / npm 8.6.0 or later. Strip TypeScript from packed component scripts while keeping public declarations.
- Treat whitespace-only labels as decorative in unified and dedicated Filled components.
- Require the full verification suite before publishing, including packed-consumer, import isolation, compatibility and browser checks.

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
