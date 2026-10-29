<script lang="ts">
  import { onMount } from 'svelte';
  import * as Icons from '@squircle-icons/svelte';
  import Camera from '@squircle-icons/svelte/camera';
  import Trash from '@squircle-icons/svelte/trash';
  import { FIGMA_STUDY_ICONS } from '@squircle-icons/svelte/design/figma-catalog';
  import SunMoonMorph from '@squircle-icons/svelte/morph/sun-moon';
  import PlusXMorph from '@squircle-icons/svelte/morph/plus-x';
  import PlusMinusMorph from '@squircle-icons/svelte/morph/plus-minus';
  import MenuXMorph from '@squircle-icons/svelte/morph/menu-x';
  import MaximizeMinimizeMorph from '@squircle-icons/svelte/morph/maximize-minimize';
  let ready = $state(false);
  let cameraStyle = $state<'outline' | 'filled'>('outline');
  let cameraWidth = $state<number | 'thin' | 'regular' | 'bold'>('regular');
  let gallerySize = $state(24);
  let morphMoon = $state(false),
    morphProgress = $state<number | undefined>(),
    morphStyle = $state<'outline' | 'filled'>('outline');
  let plusXTarget = $state(false),
    plusXProgress = $state<number | undefined>(),
    plusXStyle = $state<'outline' | 'filled'>('outline');
  let plusMinusTarget = $state(false),
    plusMinusProgress = $state<number | undefined>(),
    plusMinusStyle = $state<'outline' | 'filled'>('outline');
  let menuXTarget = $state(false),
    menuXProgress = $state<number | undefined>();
  let maximizeMinimizeTarget = $state(false),
    maximizeMinimizeProgress = $state<number | undefined>(),
    maximizeMinimizeStyle = $state<'outline' | 'filled'>('outline');
  let movingMorphsMounted = $state(true);
  let trashProgress = $state(0),
    trashOpen = $state(false),
    trashAnimate = $state(true),
    trashMounted = $state(true),
    trashSettled = $state(false),
    trashStyle = $state<'outline' | 'filled'>('outline');
  const entries = FIGMA_STUDY_ICONS.map((icon) => ({
    ...icon,
    Icon: Icons[
      icon.id
        .split('-')
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('') as keyof typeof Icons
    ],
  }));
  onMount(() => {
    ready = true;
  });
</script>

<h1>Current packed Svelte collection</h1>
<div data-testid="ready">{ready ? 'hydrated' : 'server'}</div>
<button onclick={() => (cameraStyle = cameraStyle === 'outline' ? 'filled' : 'outline')}
  >Toggle icon style</button
>
<button onclick={() => (cameraWidth = 'bold')}>Use Bold</button>
<button onclick={() => (cameraWidth = 1.25)}>Use numeric width</button>
<div data-testid="camera">
  <Camera
    style={cameraStyle}
    strokeWidth={cameraWidth}
    color="#3155aa"
    class="custom-camera"
    label="Camera one"
  />
</div>
<div data-testid="decorative"><Camera /><Camera label="  " /></div>
{#each [16, 20, 24, 48] as size}<button onclick={() => (gallerySize = size)}>Gallery {size}</button
  >{/each}
<div data-testid="current-collection">
  {#each entries as icon}
    {#each ['outline', 'filled'] as kind}
      <article data-icon={icon.id} data-style={kind} data-group={icon.group}>
        <span data-source>{@html icon[kind as 'outline' | 'filled']}</span>
        <span data-component
          ><icon.Icon
            size={gallerySize}
            style={kind as 'outline' | 'filled'}
            label={icon.label}
          /></span
        >
      </article>
    {/each}
  {/each}
</div>
<div data-testid="unified-trash-static">
  <Trash size={20} strokeWidth="bold" label="Static Trash" />
</div>

<section data-testid="morph-fixture">
  <button
    onclick={() => {
      morphProgress = undefined;
      morphMoon = true;
    }}>Morph moon</button
  >
  <button
    onclick={() => {
      morphProgress = undefined;
      morphMoon = false;
    }}>Morph sun</button
  >
  <button onclick={() => (morphStyle = morphStyle === 'outline' ? 'filled' : 'outline')}
    >Morph style</button
  >
  <input
    aria-label="Fixture morph progress"
    type="range"
    min="0"
    max="1"
    step="0.001"
    value={morphProgress ?? 0}
    oninput={(e) => (morphProgress = Number(e.currentTarget.value))}
  />
  <SunMoonMorph
    moon={morphMoon}
    progress={morphProgress}
    style={morphStyle}
    size={96}
    label="Experimental morph"
  />
</section>
<section data-testid="plus-x-morph-fixture">
  <button
    onclick={() => {
      plusXProgress = undefined;
      plusXTarget = true;
    }}>Morph x</button
  >
  <button
    onclick={() => {
      plusXProgress = undefined;
      plusXTarget = false;
    }}>Morph plus</button
  >
  <button onclick={() => (plusXStyle = plusXStyle === 'outline' ? 'filled' : 'outline')}
    >Plus X style</button
  >
  <input
    aria-label="Fixture Plus X progress"
    type="range"
    min="0"
    max="1"
    step="0.001"
    value={plusXProgress ?? 0}
    oninput={(e) => (plusXProgress = Number(e.currentTarget.value))}
  />
  <PlusXMorph
    x={plusXTarget}
    progress={plusXProgress}
    style={plusXStyle}
    size={96}
    label="Experimental Plus X morph"
  />
  <div data-testid="plus-x-intermediate-outline">
    <PlusXMorph progress={plusXProgress ?? 0} size={96} />
  </div>
  <div data-testid="plus-x-intermediate-filled">
    <PlusXMorph progress={plusXProgress ?? 0} style="filled" size={96} />
  </div>
</section>
<section data-testid="menu-x-morph-fixture">
  <button
    onclick={() => {
      menuXProgress = undefined;
      menuXTarget = true;
    }}>Menu X open</button
  >
  <button
    onclick={() => {
      menuXProgress = undefined;
      menuXTarget = false;
    }}>Menu X close</button
  >
  <input
    aria-label="Fixture Menu X progress"
    type="range"
    min="0"
    max="1"
    step="0.001"
    value={menuXProgress ?? 0}
    oninput={(e) => (menuXProgress = Number(e.currentTarget.value))}
  />
  {#if movingMorphsMounted}<MenuXMorph
      x={menuXTarget}
      progress={menuXProgress}
      size={96}
      label="Menu X fixture"
    />{/if}
  <div data-testid="menu-x-intermediate-outline">
    <MenuXMorph progress={menuXProgress ?? 0} size={96} />
  </div>
  <div data-testid="menu-x-intermediate-filled">
    <MenuXMorph progress={menuXProgress ?? 0} style="filled" size={96} />
  </div>
</section>
<section data-testid="plus-minus-morph-fixture">
  <button onclick={() => (movingMorphsMounted = false)}>Unmount moving morphs</button>
  <button onclick={() => (movingMorphsMounted = true)}>Remount moving morphs</button>
  <button
    onclick={() => {
      plusMinusProgress = undefined;
      plusMinusTarget = true;
    }}>Morph minus</button
  >
  <button
    onclick={() => {
      plusMinusProgress = undefined;
      plusMinusTarget = false;
    }}>Morph plus from minus</button
  >
  <button onclick={() => (plusMinusStyle = plusMinusStyle === 'outline' ? 'filled' : 'outline')}
    >Plus Minus style</button
  >
  <input
    aria-label="Fixture Plus Minus progress"
    type="range"
    min="0"
    max="1"
    step="0.001"
    value={plusMinusProgress ?? 0}
    oninput={(e) => (plusMinusProgress = Number(e.currentTarget.value))}
  />
  {#if movingMorphsMounted}<PlusMinusMorph
      minus={plusMinusTarget}
      progress={plusMinusProgress}
      style={plusMinusStyle}
      size={96}
      label="Experimental Plus Minus morph"
    />{/if}
  <div data-testid="plus-minus-intermediate-outline">
    <PlusMinusMorph progress={plusMinusProgress ?? 0} size={96} />
  </div>
  <div data-testid="plus-minus-intermediate-filled">
    <PlusMinusMorph progress={plusMinusProgress ?? 0} style="filled" size={96} />
  </div>
</section>
<section data-testid="maximize-minimize-morph-fixture">
  <button
    onclick={() => {
      maximizeMinimizeProgress = undefined;
      maximizeMinimizeTarget = true;
    }}>Morph minimize</button
  >
  <button
    onclick={() => {
      maximizeMinimizeProgress = undefined;
      maximizeMinimizeTarget = false;
    }}>Morph maximize</button
  >
  <button
    onclick={() =>
      (maximizeMinimizeStyle = maximizeMinimizeStyle === 'outline' ? 'filled' : 'outline')}
    >Maximize Minimize style</button
  >
  <input
    aria-label="Fixture Maximize Minimize progress"
    type="range"
    min="0"
    max="1"
    step="0.0001"
    value={maximizeMinimizeProgress ?? 0}
    oninput={(e) => (maximizeMinimizeProgress = Number(e.currentTarget.value))}
  />
  {#if movingMorphsMounted}<MaximizeMinimizeMorph
      minimize={maximizeMinimizeTarget}
      progress={maximizeMinimizeProgress}
      style={maximizeMinimizeStyle}
      size={96}
      label="Maximize Minimize fixture"
    />{/if}
  <div data-testid="maximize-minimize-intermediate-outline">
    <MaximizeMinimizeMorph progress={maximizeMinimizeProgress ?? 0} size={96} />
  </div>
  <div data-testid="maximize-minimize-intermediate-filled">
    <MaximizeMinimizeMorph progress={maximizeMinimizeProgress ?? 0} style="filled" size={96} />
  </div>
</section>
<section data-testid="unified-trash-live">
  <button onclick={() => (trashOpen = !trashOpen)}>Toggle Trash lid</button>
  <button onclick={() => (trashAnimate = !trashAnimate)}>Toggle Trash animation</button>
  <button onclick={() => (trashMounted = !trashMounted)}>Mount Trash</button>
  <output data-testid="trash-settled">{String(trashSettled)}</output>
  {#if trashMounted}
    <Trash
      animate={trashAnimate}
      open={trashOpen}
      style={trashStyle}
      size={32}
      color="#3155aa"
      class="unified-trash"
      label="Interactive Trash"
      onsettle={(open) => (trashSettled = open)}
    />
  {/if}
</section>
<section data-testid="trash-motion-fixture">
  <Trash animate progress={trashProgress} style={trashStyle} label="Trash motion" />
  <input
    aria-label="Trash progress"
    type="range"
    min="0"
    max="1"
    step="0.001"
    bind:value={trashProgress}
  />
  <button onclick={() => (trashStyle = trashStyle === 'outline' ? 'filled' : 'outline')}
    >Trash style</button
  >
  <span data-testid="trash-static-contour"
    >{@html FIGMA_STUDY_ICONS.find((i) => i.id === 'trash')![trashStyle]}</span
  >
</section>
{#each FIGMA_STUDY_ICONS.filter( (icon) => ['sun', 'moon', 'plus', 'minus', 'x', 'menu', 'maximize', 'minimize'].includes(icon.id) ) as icon}
  {#each ['outline', 'filled'] as kind}<div data-testid={`morph-${icon.id}-${kind}-contour`}>
      {@html icon[kind as 'outline' | 'filled']}
    </div>{/each}
{/each}
