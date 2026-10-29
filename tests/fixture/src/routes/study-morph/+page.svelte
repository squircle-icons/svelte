<script lang="ts">
  import { onMount } from 'svelte';
  import MaximizeMinimizeStudyMorph from '@squircle-icons/svelte/morph/maximize-minimize-study';
  import { WINDOW_TRANSFER_STUDY } from '@squircle-icons/svelte/design/window-transfer';
  let target = $state(false);
  let progress = $state<number | undefined>(undefined);
  let style = $state<'outline' | 'filled'>('outline');
  let mounted = $state(true);
  let ready = $state(false);
  onMount(() => {
    ready = true;
  });
</script>

<p data-testid="ready">{ready ? 'hydrated' : 'server'}</p>
<button
  onclick={() => {
    progress = undefined;
    target = true;
  }}>Morph minimize</button
>
<button
  onclick={() => {
    progress = undefined;
    target = false;
  }}>Morph maximize</button
>
<button onclick={() => (style = style === 'outline' ? 'filled' : 'outline')}
  >Maximize Minimize style</button
>
<button onclick={() => (mounted = !mounted)}>{mounted ? 'Unmount' : 'Remount'} moving morphs</button
>
<input
  aria-label="Fixture Maximize Minimize progress"
  type="range"
  min="0"
  max="1"
  step="0.0001"
  value={progress ?? 0}
  oninput={(e) => (progress = Number(e.currentTarget.value))}
/>
{#if mounted}
  <MaximizeMinimizeStudyMorph
    minimize={target}
    {progress}
    {style}
    size={240}
    label="Maximize Minimize fixture"
  />
{/if}
{#each WINDOW_TRANSFER_STUDY.filter((icon) => ['maximize', 'minimize'].includes(icon.id)) as icon}
  {#each ['outline', 'filled'] as kind}
    <div data-testid={`${icon.id}-${kind}-contour`}>{@html icon[kind as 'outline' | 'filled']}</div>
  {/each}
{/each}
