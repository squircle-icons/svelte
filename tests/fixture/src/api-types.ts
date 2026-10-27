import type { ComponentProps } from 'svelte';
import Camera from '@squircle-icons/svelte/camera';
import Search from '@squircle-icons/svelte/search';
import PlusSquare from '@squircle-icons/svelte/plus-square';

const camera: ComponentProps<typeof Camera> = {
  style: 'filled',
  size: 24,
  label: 'Camera',
  strokeWidth: 'bold',
};
const search: ComponentProps<typeof Search> = { style: 'outline' };
const filledSearch: ComponentProps<typeof Search> = { style: 'filled' };
// @ts-expect-error Animation is not part of the public API.
const animatedCamera: ComponentProps<typeof Camera> = { animate: 'on' };
// @ts-expect-error Stroke presets have fixed names.
const invalidStroke: ComponentProps<typeof Camera> = { strokeWidth: 'heavy' };
void [invalidStroke, camera, search, filledSearch, animatedCamera];

// Frames are independent static components; no icon accepts a runtime frame selector.
// @ts-expect-error Camera does not accept a frame prop.
const framedCamera: ComponentProps<typeof Camera> = { frame: 'square' };
// @ts-expect-error Even a frame-ready base has no runtime frame selector.
const framedPlus: import('@squircle-icons/svelte').IconProps = { frame: 'circle' };
const plusSquare: ComponentProps<typeof PlusSquare> = { style: 'filled', label: 'Add' };
// @ts-expect-error A fixed Square component cannot switch its frame either.
const switchedSquare: ComponentProps<typeof PlusSquare> = { frame: 'circle' };
// @ts-expect-error Framed identities have Outline/Filled; unframed Bold is a separate style.
const boldSquare: ComponentProps<typeof PlusSquare> = { style: 'bold' };
void [framedCamera, framedPlus, plusSquare, switchedSquare, boldSquare];
