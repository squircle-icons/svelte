<script>
  import { onMount } from 'svelte';
  import Camera from '@squircle-icons/svelte/camera';
  import Folder from '@squircle-icons/svelte/folder';
  import FilledCamera from '@squircle-icons/svelte/filled/camera';
  let filled = $state(false);
  let width = $state('regular');
  let ready = $state(false);
  onMount(() => {
    ready = true;
  });
</script>

<p id="ready">{ready ? 'hydrated' : 'server'}</p>
<button
  id="style"
  onclick={() => {
    filled = !filled;
  }}>Toggle style</button
>
<button
  id="preset"
  onclick={() => {
    width = 'bold';
  }}>Use bold</button
>
<button
  id="number"
  onclick={() => {
    width = 1.5;
  }}>Use number</button
>
<div id="camera">
  <Camera label="Compatible camera" style={filled ? 'filled' : 'outline'} strokeWidth={width} />
</div>
<div id="folder"><Folder style="filled" strokeWidth={width} /></div>
<div id="dedicated"><FilledCamera /></div>
