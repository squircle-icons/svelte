# Repository split provenance

## Unified static imports

The development API now has one component per static icon. The old `/filled` barrel, `/filled/<icon>` subpaths and `FilledIconProps` type have been removed. This is a breaking change for consumers of those entry points; existing published versions keep their original API.

Import the normal component and pass its style explicitly:

```svelte
<script>
  import Camera from '@squircle-icons/svelte/camera';
</script>

<Camera />
<Camera style="filled" />
```

Outline is still the default. Existing sizes, colors, labels, stroke-width presets/numbers and authored Filled geometry are preserved. Root named imports remain supported. Morph pairs keep their independent opt-in subpaths.

## Original repository split

This alpha repository was split from `palamto/squircle-icons` at commit `21cdd88b90f93f13d0ed628cd7a163b866881bd9` on 2026-10-26. The original repository is retained privately with its original history as the pre-split record.

The active repositories are [core](https://github.com/squircle-icons/core), [svelte](https://github.com/squircle-icons/svelte), and [homepage](https://github.com/squircle-icons/homepage). This is the **svelte** repository. No other framework adapter is implemented yet. The temporary name `squircle-icons-svelte` was replaced by `@squircle-icons/svelte` for the first alpha release. Original artwork and code are licensed under [MIT](LICENSE).
