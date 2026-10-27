<script>
  import { onMount } from 'svelte';
  import Camera from '@squircle-icons/svelte/camera';
  import Folder from '@squircle-icons/svelte/folder';
  import FilledCamera from '@squircle-icons/svelte/filled/camera';
  import MenuXMorph from '@squircle-icons/svelte/morph/menu-x';
  import PlusMinusMorph from '@squircle-icons/svelte/morph/plus-minus';
  import PlusXMorph from '@squircle-icons/svelte/morph/plus-x';
  import SunMoonMorph from '@squircle-icons/svelte/morph/sun-moon';
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
<div id="morph"><SunMoonMorph progress={0.5} label="Compatible morph" /></div>

<PlusXMorph progress={0.5} label="Compatible Plus X morph" />

<MenuXMorph progress={0.5} label="Compatible Menu X morph" />

<PlusMinusMorph progress={0.5} label="Compatible Plus Minus morph" />
