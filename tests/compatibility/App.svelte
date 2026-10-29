<script>
  import Trash from '@squircle-icons/svelte/trash';
  import MaximizeMinimizeMorph from '@squircle-icons/svelte/morph/maximize-minimize';
  import { onMount } from 'svelte';
  import Camera from '@squircle-icons/svelte/camera';
  import Folder from '@squircle-icons/svelte/folder';
  import MenuXMorph from '@squircle-icons/svelte/morph/menu-x';
  import PlusMinusMorph from '@squircle-icons/svelte/morph/plus-minus';
  import PlusXMorph from '@squircle-icons/svelte/morph/plus-x';
  import SunMoonMorph from '@squircle-icons/svelte/morph/sun-moon';
  let filled = $state(false);
  let width = $state('regular');
  let ready = $state(false);
  let active = $state(false);
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
<div id="folder"><Folder strokeWidth={width} /></div>
<div id="decorative-filled"><Camera style="filled" /></div>
<button id="morph-target" onclick={() => (active = !active)}>Toggle morph destinations</button>
<div id="morph"><SunMoonMorph moon={active} label="Compatible morph" /></div>

<PlusXMorph x={active} label="Compatible Plus X morph" />

<MenuXMorph x={active} label="Compatible Menu X morph" />

<PlusMinusMorph minus={active} label="Compatible Plus Minus morph" />

<MaximizeMinimizeMorph minimize={active} label="Compatible Maximize Minimize morph" />

<Trash animate progress={0.5} label="Compatible trash motion" />
