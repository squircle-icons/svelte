import type { ComponentProps } from 'svelte';
import Camera from '@squircle-icons/svelte/camera';
import Heart from '@squircle-icons/svelte/heart';
import Trash from '@squircle-icons/svelte/trash';
const camera: ComponentProps<typeof Camera> = { style: 'filled', strokeWidth: 'bold' };
const trash: ComponentProps<typeof Trash> = { animate: true, open: true };
// @ts-expect-error No authored Camera motion exists.
const invalidMotion: ComponentProps<typeof Camera> = { animate: true };
// @ts-expect-error Styles are Outline/Filled only.
const invalidStyle: ComponentProps<typeof Camera> = { style: 'bold' };
// @ts-expect-error No legacy frame selector exists.
const invalidFrame: ComponentProps<typeof Camera> = { frame: 'square' };
// @ts-expect-error Expanded Outline has no editable stroke.
const invalidHeart: ComponentProps<typeof Heart> = { strokeWidth: 2 };
void [camera, trash, invalidMotion, invalidStyle, invalidFrame, invalidHeart];
