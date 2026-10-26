<script lang="ts">
  import { onMount } from 'svelte';
  import Camera from 'squircle-icons-svelte/camera';
  import FilledFolder from 'squircle-icons-svelte/filled/folder';
  import {
    Camera as FilledCamera,
    Bell as FilledBell,
    Heart as FilledHeart,
    Settings as FilledSettings,
  } from 'squircle-icons-svelte/filled';
  import Folder from 'squircle-icons-svelte/animated/folder';
  import Bell from 'squircle-icons-svelte/animated/bell';
  import {
    Heart,
    Search,
    Settings,
    Bell as StaticBell,
    Folder as StaticFolder,
  } from 'squircle-icons-svelte';
  import { Bell as BarrelBell } from 'squircle-icons-svelte/animated';
  let ready = $state(false);
  let open = $state(false);
  let mounted = $state(true);
  let hover = $state(false);
  let always = $state(false);
  let color = $state('#27272a');
  let size = $state(48);
  let strokeWidth = $state(1.75);
  let bell = $state<{ play(): void; reset(): void }>();
  let folder = $state<{ reset(): void }>();
  onMount(() => {
    ready = true;
  });
</script>

<h1>Packed Svelte consumer</h1>
<div data-testid="ready">{ready ? 'hydrated' : 'server'}</div>
<div data-testid="controls">
  <button onclick={() => (open = !open)}>Toggle folder</button>
  <button onclick={() => bell?.play()}>Play bell</button>
  <button
    onclick={() => {
      folder?.reset();
      bell?.reset();
    }}>Reset</button
  >
  <button onclick={() => (mounted = !mounted)}>{mounted ? 'Unmount' : 'Mount'}</button>
  <label><input type="checkbox" bind:checked={hover} /> Hover</label>
  <label><input type="checkbox" bind:checked={always} /> Always reduce</label>
  <button
    onclick={() => {
      color = '#6b50a1';
      size = 64;
      strokeWidth = 2;
    }}>Change presentation</button
  >
</div>
<div class="stage" data-testid="moving">
  {#if mounted}<div data-testid="folder">
      <Folder
        bind:this={folder}
        {open}
        {hover}
        reducedMotion={always ? 'always' : 'system'}
        {color}
        {size}
        {strokeWidth}
        label="Animated folder"
      />
    </div>
    <div data-testid="bell">
      <Bell
        bind:this={bell}
        {hover}
        reducedMotion={always ? 'always' : 'system'}
        {color}
        {size}
        {strokeWidth}
        label="Animated bell"
      />
    </div>{/if}
</div>
<div class="stage" data-testid="initial-open"><Folder open size={48} label="Already open" /></div>
<div class="stage" data-testid="instances">
  <Camera label="Camera one" /><Camera label="Camera two" /><Camera /><Folder /><BarrelBell />
</div>
<div class="contact" data-testid="contact-sheet">
  {#each [Camera, StaticFolder, StaticBell, Heart, Search, Settings] as Icon}<div>
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
<div data-testid="filled-folder">
  <FilledFolder size={24} {strokeWidth} label="Filled folder" />
</div>

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
  label {
    margin: 10px;
  }
  .stage {
    display: flex;
    gap: 32px;
    margin: 24px 0;
    padding: 20px;
    background: #eef2ff;
    border-radius: 12px;
  }
  .stage > div {
    display: grid;
    place-items: center;
    width: 100px;
    height: 110px;
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
