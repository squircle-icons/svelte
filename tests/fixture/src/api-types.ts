import type { ComponentProps } from 'svelte';
import Camera from '@squircle-icons/svelte/camera';
import Search from '@squircle-icons/svelte/search';

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
