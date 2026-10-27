<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { sunMoonFrame } from './sun-moon-geometry.js';
  import geometry from './sun-moon-data.js';

  let {
    moon = false,
    progress,
    speed = 1,
    size = 24,
    color = 'currentColor',
    style: iconStyle = 'outline',
    label,
    class: className,
    onprogress,
    onsettle,
  }: {
    moon?: boolean;
    progress?: number;
    speed?: number;
    size?: number | string;
    color?: string;
    style?: 'outline' | 'filled';
    label?: string;
    class?: string;
    onprogress?: (progress: number) => void;
    onsettle?: (moon: boolean) => void;
  } = $props();

  const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  let position = $state(untrack(() => (progress === undefined ? (moon ? 1 : 0) : clamp(progress))));
  let reduced = $state(false);
  let mounted = $state(false);
  let velocity = 0;
  let target = untrack(() => (moon ? 1 : 0));
  let rate = 1;
  let frameId = 0;
  let previousTime = 0;
  let settled = true;
  const visual = $derived(clamp(position));
  const frame = $derived(sunMoonFrame(visual, geometry));
  const accessibleLabel = $derived(label?.trim());

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    previousTime = 0;
  }
  function publish() {
    onprogress?.(clamp(position));
  }
  function advance(now: number) {
    frameId = 0;
    const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.064) * rate : 0;
    previousTime = now;
    // Exact critically damped solution: mass1 / stiffness100 / damping20.
    // Retargeting changes only the destination, retaining position AND velocity.
    const offset = position - target;
    const carry = velocity + 10 * offset;
    const decay = Math.exp(-10 * dt);
    position = target + (offset + carry * dt) * decay;
    velocity = (velocity - 10 * carry * dt) * decay;
    if (Math.abs(position - target) < 0.0001 && Math.abs(velocity) < 0.002) {
      position = target;
      velocity = 0;
      settled = true;
      previousTime = 0;
      publish();
      onsettle?.(Boolean(target));
    } else {
      publish();
      frameId = requestAnimationFrame(advance);
    }
  }
  function start() {
    if (!frameId && !document.hidden) frameId = requestAnimationFrame(advance);
  }
  $effect(() => {
    const destination = moon ? 1 : 0;
    const controlled = progress;
    const reduce = reduced;
    const ready = mounted;
    const nextRate = Math.max(0.1, Math.min(3, Number.isFinite(speed) ? speed : 1));
    untrack(() => {
      target = destination;
      rate = nextRate;
      if (!ready) return;
      if (controlled !== undefined || reduce) {
        stop();
        position = controlled === undefined ? target : clamp(controlled);
        velocity = 0;
        settled = true;
        publish();
      } else if (Math.abs(position - target) > 0.0001 || Math.abs(velocity) > 0.002) {
        settled = false;
        start();
      }
    });
  });
  onMount(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reduced = preference.matches;
    };
    update();
    preference.addEventListener('change', update);
    const visibility = () => {
      if (document.hidden) stop();
      else if (!settled && progress === undefined && !reduced) start();
    };
    document.addEventListener('visibilitychange', visibility);
    mounted = true;
    return () => {
      stop();
      preference.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', visibility);
    };
  });
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  class={className}
  fill={iconStyle === 'filled' ? color : 'none'}
  stroke={color}
  stroke-width={geometry.strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  role={accessibleLabel ? 'img' : undefined}
  aria-label={accessibleLabel || undefined}
  aria-hidden={accessibleLabel ? undefined : true}
  focusable="false"
  data-morph="sun-moon"
  data-progress={visual.toFixed(5)}
  data-state={visual === 0 ? 'sun' : visual === 1 ? 'moon' : 'morph'}
>
  <path data-part="body" d={frame.body} />
  <g data-part="rays" fill="none" opacity={frame.rayOpacity}>
    {#each frame.rays as ray}<path d={ray} />{/each}
  </g>
</svg>
