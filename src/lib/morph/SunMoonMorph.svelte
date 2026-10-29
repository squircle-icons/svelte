<script lang="ts">
  import MorphProgress from './MorphProgress.svelte';
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

  const accessibleLabel = $derived(label?.trim());
</script>

<MorphProgress end={moon} {progress} {speed} {onprogress} {onsettle}>
  {#snippet children(visual)}
    {@const frame = sunMoonFrame(visual, geometry)}
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
      data-source="figma-current"
      data-morph="sun-moon"
      data-progress={visual.toFixed(5)}
      data-state={visual === 0 ? 'sun' : visual === 1 ? 'moon' : 'morph'}
    >
      <path
        data-part="body"
        d={iconStyle === 'filled' && visual === 0
          ? geometry.sun.filledPath
          : iconStyle === 'filled' && visual === 1
            ? geometry.moon.filledPath
            : frame.body}
        stroke={iconStyle === 'filled' && (visual === 0 || visual === 1) ? 'none' : undefined}
      />
      <g data-part="rays" fill="none" opacity={frame.rayOpacity}>
        {#each frame.rays as ray}<path d={ray} />{/each}
      </g>
    </svg>
  {/snippet}
</MorphProgress>
