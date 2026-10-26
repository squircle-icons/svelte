import type { ComponentProps } from 'svelte';
import Camera from '@squircle-icons/svelte/camera';
import Search from '@squircle-icons/svelte/search';

const camera: ComponentProps<typeof Camera> = { style: 'filled', size: 24, label: 'Camera' };
const search: ComponentProps<typeof Search> = { style: 'outline' };
// @ts-expect-error Search has no filled artwork.
const filledSearch: ComponentProps<typeof Search> = { style: 'filled' };
// @ts-expect-error Animation is not part of the public API.
const animatedCamera: ComponentProps<typeof Camera> = { animate: 'on' };
void [camera, search, filledSearch, animatedCamera];
