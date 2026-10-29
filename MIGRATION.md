# Migrate to0.2.0-alpha.0

This release replaces the old121 collection with 94 current source pairs. It is a breaking alpha update. Published older npm versions remain immutable; current source/package outputs contain no legacy icons, frame variants or prototype datasets.

- Keep normal imports such as `@squircle-icons/svelte/camera`; they now render current artwork. Select `style="outline"` (default) or `style="filled"` on the same component.
- Replace `/filled/<icon>` or the `/filled` barrel with the normal import and `style="filled"`.
- Remove old `-square`/`-circle` enclosing-frame imports. The new source has independent identities such as `square`; no automatic old-frame aliases are retained.
- Rename `/log-in`→`/login` and `/log-out`→`/logout`. Removed identities have no silent replacement; use the current catalog.
- Default Regular stroke is now1.5. Numbers and Thin/Bold presets remain supported for real stroked Outlines. Heart/Pen retain fixed expanded geometry; Filled is fixed source paint.
- `style="bold"` is removed. Use `strokeWidth="bold"` for supported Outline components, or the authored Filled style.
- Use `<Trash animate open={open} />` with the normal Trash import. Animated thickness is fixed; static and animated Trash now use the same current source. The direct `motion/trash` export remains available.
- The five morph imports and destination props remain available. They keep current endpoints and existing motion timing.
- Remove old `design/squircle-base` and `design/window-transfer` helper imports. They were superseded prototypes. The current opt-in `design/figma-catalog` provides source/review data for the private Lab; ordinary icon imports do not load it.

The repository originated from a private workspace split. Core owns original source, Svelte owns components and the independent private Lab owns review UI. Original artwork and code are MIT licensed. Draft/approved metadata reflects visual review; publication alone does not change it.
