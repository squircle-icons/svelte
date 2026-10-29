<script lang="ts">
  import MorphProgress from './MorphProgress.svelte';
  import { trashFrame } from './trash-geometry.js';
  import geometry from './trash-data.js';
  let {
    open = false,
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
    open?: boolean;
    progress?: number;
    speed?: number;
    size?: number | string;
    color?: string;
    style?: 'outline' | 'filled';
    label?: string;
    class?: string;
    onprogress?: (progress: number) => void;
    onsettle?: (open: boolean) => void;
  } = $props();

  const accessibleLabel = $derived(label?.trim());
</script>

<!-- Lid and handle share a rigid transform and the reversible progress controller. -->
<MorphProgress end={open} {progress} speed={speed * 0.7} {onprogress} {onsettle}>
  {#snippet children(visual)}
    {@const drawing = trashFrame(visual, geometry)}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      class={className}
      fill={iconStyle === 'filled' ? color : 'none'}
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
      data-morph="trash"
      data-progress={visual.toFixed(5)}
      data-state={visual === 0 ? 'closed' : visual === 1 ? 'open' : 'motion'}
    >
      {#if iconStyle === 'filled'}
        <path data-part="body" d={drawing.filled} fill-rule="nonzero" />
      {:else}
        <path data-part="body" d={geometry.outline.body} />
        <path data-part="marks" d={geometry.outline.marks} />
        <g data-part="lid" transform={drawing.transform}><path d={geometry.outline.lid} /></g>
      {/if}
    </svg>
  {/snippet}
</MorphProgress>
