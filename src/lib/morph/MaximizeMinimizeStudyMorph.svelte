<script lang="ts">
  import MorphProgress from './MorphProgress.svelte';
  import { maximizeMinimizeStudyFrame } from './maximize-minimize-study-geometry.js';
  import geometry from './maximize-minimize-study-data.js';
  let {
    minimize = false,
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
    minimize?: boolean;
    progress?: number;
    speed?: number;
    size?: number | string;
    color?: string;
    style?: 'outline' | 'filled';
    label?: string;
    class?: string;
    onprogress?: (progress: number) => void;
    onsettle?: (minimize: boolean) => void;
  } = $props();
  const accessibleLabel = $derived(label?.trim());
</script>

<MorphProgress end={minimize} {progress} speed={speed * 0.6} {onprogress} {onsettle}>
  {#snippet children(visual)}
    {@const drawing = maximizeMinimizeStudyFrame(visual, geometry)}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      class={className}
      fill={iconStyle === 'filled' ? color : 'none'}
      fill-rule={iconStyle === 'filled' ? 'nonzero' : undefined}
      stroke={iconStyle === 'filled' ? 'none' : color}
      stroke-width={iconStyle === 'filled' ? undefined : geometry.strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      role={accessibleLabel ? 'img' : undefined}
      aria-label={accessibleLabel || undefined}
      aria-hidden={accessibleLabel ? undefined : true}
      focusable="false"
      data-frame="none"
      data-morph="maximize-minimize-study"
      data-source="window-transfer-study"
      data-progress={visual.toFixed(5)}
      data-state={visual === 0 ? 'maximize' : visual === 1 ? 'minimize' : 'morph'}
    >
      <path data-part="body" d={iconStyle === 'filled' ? drawing.filled : drawing.outline} />
    </svg>
  {/snippet}
</MorphProgress>
