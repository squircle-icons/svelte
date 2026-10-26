import { onMount } from 'svelte';
import { createMotionController } from './_internal/controller.js';
import type { MotionRecipe } from './_internal/types.js';

type Options = { state?: string; reducedMotion: 'system' | 'always' };
/** The Svelte adapter owns lifecycle and preference listeners, never the recipes. */
export function bindMotion(
  root: () => SVGSVGElement | undefined,
  recipe: MotionRecipe,
  options: () => Options,
) {
  let controller: ReturnType<typeof createMotionController> | undefined;
  let preference: MediaQueryList | undefined;
  const sync = () => {
    const current = options();
    controller?.setReduced(current.reducedMotion === 'always' || !!preference?.matches);
    if (current.state) controller?.setState(current.state);
  };
  onMount(() => {
    preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    controller = createMotionController(root()!, recipe, options().state);
    sync();
    preference.addEventListener('change', sync);
    return () => {
      preference?.removeEventListener('change', sync);
      controller?.destroy();
      controller = undefined;
      preference = undefined;
    };
  });
  $effect(() => {
    options();
    sync();
  });
  return {
    play: () => controller?.play(),
    reset: (state?: string) => controller?.reset(state),
  };
}
