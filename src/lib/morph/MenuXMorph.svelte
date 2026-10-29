<script lang="ts">
  import MorphProgress from './MorphProgress.svelte';
  import { menuXFrame } from './menu-x-geometry.js';
  import geometry from './menu-x-data.js';
  let {
    x = false,
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
    x?: boolean;
    progress?: number;
    speed?: number;
    size?: number | string;
    color?: string;
    style?: 'outline' | 'filled';
    label?: string;
    class?: string;
    onprogress?: (progress: number) => void;
    onsettle?: (x: boolean) => void;
  } = $props();

  const accessibleLabel = $derived(label?.trim());
</script>

<!-- Deliberately paced, with the shared reversible progress controller. -->
<MorphProgress end={x} {progress} speed={speed * 0.6} {onprogress} {onsettle}>
  {#snippet children(visual)}
    {@const drawing = menuXFrame(visual, geometry)}
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
      data-frame="none"
      data-source="figma-current"
      data-glyph-width={drawing.filledWidth}
      data-morph="menu-x"
      data-progress={visual.toFixed(5)}
      data-state={visual === 0 ? 'menu' : visual === 1 ? 'x' : 'morph'}
    >
      <path data-part="body" d={iconStyle === 'filled' ? drawing.filled : drawing.outline} />
      {#if iconStyle === 'outline' && drawing.middle}
        <path data-part="middle" d={drawing.middle} stroke-width={drawing.middleWidth} />
      {/if}
    </svg>
  {/snippet}
</MorphProgress>
