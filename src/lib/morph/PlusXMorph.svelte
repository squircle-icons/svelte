<script lang="ts">
  import MorphProgress from './MorphProgress.svelte';
  import { plusXFrame } from './plus-x-geometry.js';
  import geometry from './plus-x-data.js';
  let {
    x = false,
    progress,
    speed = 1,
    frame,
    size = 24,
    color = 'currentColor',
    style: iconStyle = 'outline',
    label,
    class: className,
    onprogress,
    onsettle,
  }: {
    x?: boolean;
    progress?: number;
    speed?: number;
    frame?: 'none' | 'square' | 'circle';
    size?: number | string;
    color?: string;
    style?: 'outline' | 'filled';
    label?: string;
    class?: string;
    onprogress?: (progress: number) => void;
    onsettle?: (x: boolean) => void;
  } = $props();

  const activeFrame = $derived(frame ?? (iconStyle === 'filled' ? 'square' : 'none'));
  const accessibleLabel = $derived(label?.trim());
</script>

<!-- Keep this two-stage fold legible at default speed; Sun Moon retains its own pace. -->
<MorphProgress end={x} {progress} speed={speed * 0.4} {onprogress} {onsettle}>
  {#snippet children(visual)}
    {@const drawing = plusXFrame(visual, geometry, activeFrame)}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      class={className}
      fill={iconStyle === 'filled' ? color : 'none'}
      fill-rule={iconStyle === 'filled' ? 'evenodd' : undefined}
      stroke={iconStyle === 'filled' ? 'none' : color}
      stroke-width={iconStyle === 'filled' ? undefined : geometry.strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      role={accessibleLabel ? 'img' : undefined}
      aria-label={accessibleLabel || undefined}
      aria-hidden={accessibleLabel ? undefined : true}
      focusable="false"
      data-frame={activeFrame}
      data-morph="plus-x"
      data-progress={visual.toFixed(5)}
      data-state={visual === 0 ? 'plus' : visual === 1 ? 'x' : 'morph'}
    >
      {#if iconStyle === 'outline' && activeFrame !== 'none'}
        <path data-part="frame" d={geometry.frames[activeFrame].outline} />
      {/if}
      <path data-part="body" d={iconStyle === 'filled' ? drawing.filled : drawing.outline} />
    </svg>
  {/snippet}
</MorphProgress>
