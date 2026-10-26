<script lang="ts">
  import { onMount } from 'svelte';
  import Camera from '@squircle-icons/svelte/camera';
  import Sun from '@squircle-icons/svelte/sun';
  import Moon from '@squircle-icons/svelte/moon';
  import FilledSun from '@squircle-icons/svelte/filled/sun';
  import FilledMoon from '@squircle-icons/svelte/filled/moon';
  import FilledFolder from '@squircle-icons/svelte/filled/folder';
  import {
    Camera as FilledCamera,
    Bell as FilledBell,
    Heart as FilledHeart,
    Settings as FilledSettings,
  } from '@squircle-icons/svelte/filled';
  import { Heart, Search, Settings, Bell, Folder } from '@squircle-icons/svelte';
  let hovered = $state(false);
  let focused = $state(false);
  let preset = $state<'thin' | 'regular' | 'bold'>('regular');
  let ready = $state(false);
  let iconStyle = $state<'outline' | 'filled'>('filled');
  let strokeWidth = $state(1.75);
  onMount(() => {
    ready = true;
  });
</script>

<h1>Packed Svelte consumer</h1>
<div data-testid="ready">{ready ? 'hydrated' : 'server'}</div>
<div data-testid="instances">
  <Camera label="Camera one" /><Camera label="Camera two" /><Camera /><Folder /><Bell />
</div>
<div class="contact" data-testid="contact-sheet">
  {#each [Camera, Folder, Bell, Heart, Search, Settings] as Icon}<div>
      {#each [16, 20, 24, 48] as n}<Icon size={n} />{/each}
    </div>{/each}
</div>
<div class="contact" data-testid="filled-contact-sheet">
  {#each [FilledCamera, FilledFolder, FilledBell, FilledHeart, FilledSettings] as Icon}<div>
      {#each [16, 20, 24, 48] as n}<Icon size={n} />{/each}
    </div>{/each}
</div>
<div data-testid="filled-camera"><FilledCamera label="Filled camera review" /></div>
<div data-testid="filled-settings"><FilledSettings label="Filled settings review" /></div>
<div data-testid="filled-folder"><FilledFolder {strokeWidth} label="Filled folder" /></div>
<div data-testid="bell-outline-contour"><Bell size={96} label="Outline Bell contour" /></div>
<div data-testid="bell-filled-contour"><FilledBell size={96} label="Filled Bell contour" /></div>
<div data-testid="settings-outline-contour">
  <Settings size={96} label="Outline Settings contour" />
</div>
<div data-testid="settings-filled-contour">
  <FilledSettings size={96} label="Filled Settings contour" />
</div>
<div data-testid="heart-outline-contour"><Heart size={96} label="Outline Heart contour" /></div>
<div data-testid="heart-filled-contour"><FilledHeart size={96} label="Filled Heart contour" /></div>
<div data-testid="sun-outline-contour"><Sun size={96} label="Outline Sun contour" /></div>
<div data-testid="sun-filled-contour"><FilledSun size={96} label="Filled Sun contour" /></div>
<div data-testid="moon-outline-contour"><Moon size={96} label="Outline Moon contour" /></div>
<div data-testid="moon-filled-contour"><FilledMoon size={96} label="Filled Moon contour" /></div>
<button
  aria-label="Preview camera styles"
  onpointerenter={() => (hovered = true)}
  onpointerleave={() => (hovered = false)}
  onfocus={() => (focused = true)}
  onblur={() => (focused = false)}
>
  <Camera style={hovered || focused ? 'filled' : 'outline'} />
</button>
<label
  >Stroke preset<select aria-label="Stroke preset" bind:value={preset}
    ><option>thin</option><option>regular</option><option>bold</option></select
  ></label
>
<div data-testid="stroke-preset"><Camera strokeWidth={preset} label="Named stroke camera" /></div>
<div data-testid="gap-preset"><Folder style="filled" strokeWidth={preset} /></div>
<section data-testid="unified-api">
  <button onclick={() => (iconStyle = iconStyle === 'filled' ? 'outline' : 'filled')}
    >Toggle icon style</button
  >
  <button onclick={() => (strokeWidth = 2)}>Change divider width</button>
  <div data-testid="unified-default"><Camera size={24} label="Unified default camera" /></div>
  <div data-testid="unified-camera">
    <Camera size={24} label="Unified camera" style={iconStyle} class="custom-camera" />
  </div>
  <div data-testid="unified-folder"><Folder style="filled" {strokeWidth} /></div>
  <div data-testid="unified-filled-sheet">
    {#each [Camera, Folder, Bell, Heart, Settings] as Icon}<Icon style="filled" />{/each}
  </div>
</section>

<style>
  :global(body) {
    font-family: system-ui;
    background: #ffffff;
    color: #27272a;
    padding: 28px;
  }
  button {
    margin: 6px;
    padding: 9px;
  }
  .contact {
    display: flex;
    gap: 22px;
    background: #ffffff;
    padding: 24px;
    width: fit-content;
  }
  .contact > div {
    display: flex;
    flex-direction: column;
    gap: 25px;
    align-items: center;
  }
</style>
