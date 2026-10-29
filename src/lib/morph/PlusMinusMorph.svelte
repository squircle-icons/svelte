<script lang="ts">
  import MorphProgress from './MorphProgress.svelte';
  import { plusMinusFrame } from './plus-minus-geometry.js';
  import geometry from './plus-minus-data.js';
  let {
    minus = false,
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
    minus?: boolean;
    progress?: number;
    speed?: number;
    size?: number | string;
    color?: string;
    style?: 'outline' | 'filled';
    label?: string;
    class?: string;
    onprogress?: (progress: number) => void;
    onsettle?: (minus: boolean) => void;
  } = $props();

  const accessibleLabel = $derived(label?.trim());
</script>

<!-- Give the single fold its own proposed pace; approved Plus X timing stays unchanged. -->
<MorphProgress end={minus} {progress} speed={speed * 0.6} {onprogress} {onsettle}>
  {#snippet children(visual)}
    {@const drawing = plusMinusFrame(visual, geometry)}
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
      data-morph="plus-minus"
      data-progress={visual.toFixed(5)}
      data-state={visual === 0 ? 'plus' : visual === 1 ? 'minus' : 'morph'}
    >
      <path data-part="body" d={iconStyle === 'filled' ? drawing.filled : drawing.outline} />
    </svg>
  {/snippet}
</MorphProgress>
