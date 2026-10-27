<script lang="ts">
  import { onMount } from 'svelte';
  import PlusXMorph from '@squircle-icons/svelte/morph/plus-x';
  let plusXTarget = $state(false);
  let plusXProgress = $state<number | undefined>(undefined);
  let plusXStyle = $state<'outline' | 'filled'>('outline');
  import SunMoonMorph from '@squircle-icons/svelte/morph/sun-moon';
  let morphMoon = $state(false);
  let morphProgress = $state<number | undefined>(undefined);
  let morphStyle = $state<'outline' | 'filled'>('outline');
  import X from '@squircle-icons/svelte/x';
  import FilledX from '@squircle-icons/svelte/filled/x';
  import Copy from '@squircle-icons/svelte/copy';
  import FilledCopy from '@squircle-icons/svelte/filled/copy';
  import FilledSearch from '@squircle-icons/svelte/filled/search';
  import ChevronDown from '@squircle-icons/svelte/chevron-down';
  import FilledChevronDown from '@squircle-icons/svelte/filled/chevron-down';
  import Plus from '@squircle-icons/svelte/plus';
  import FilledPlus from '@squircle-icons/svelte/filled/plus';
  import Check from '@squircle-icons/svelte/check';
  import FilledCheck from '@squircle-icons/svelte/filled/check';
  import ChevronUp from '@squircle-icons/svelte/chevron-up';
  import FilledChevronUp from '@squircle-icons/svelte/filled/chevron-up';
  import ArrowLeft from '@squircle-icons/svelte/arrow-left';
  import FilledArrowLeft from '@squircle-icons/svelte/filled/arrow-left';
  import ArrowRight from '@squircle-icons/svelte/arrow-right';
  import FilledArrowRight from '@squircle-icons/svelte/filled/arrow-right';
  import Menu from '@squircle-icons/svelte/menu';
  import FilledMenu from '@squircle-icons/svelte/filled/menu';
  import Download from '@squircle-icons/svelte/download';
  import FilledDownload from '@squircle-icons/svelte/filled/download';
  import Upload from '@squircle-icons/svelte/upload';
  import FilledUpload from '@squircle-icons/svelte/filled/upload';
  import Trash from '@squircle-icons/svelte/trash';
  import FilledTrash from '@squircle-icons/svelte/filled/trash';
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
  const roundFour = [
    { name: 'arrow-left', label: 'Arrow Left', Outline: ArrowLeft, Filled: FilledArrowLeft },
    { name: 'arrow-right', label: 'Arrow Right', Outline: ArrowRight, Filled: FilledArrowRight },
    { name: 'menu', label: 'Menu', Outline: Menu, Filled: FilledMenu },
    { name: 'download', label: 'Download', Outline: Download, Filled: FilledDownload },
    { name: 'upload', label: 'Upload', Outline: Upload, Filled: FilledUpload },
    { name: 'trash', label: 'Trash', Outline: Trash, Filled: FilledTrash },
  ];
  import ArrowUp from '@squircle-icons/svelte/arrow-up';
  import FilledArrowUp from '@squircle-icons/svelte/filled/arrow-up';
  import ArrowDown from '@squircle-icons/svelte/arrow-down';
  import FilledArrowDown from '@squircle-icons/svelte/filled/arrow-down';
  import ArrowUpLeft from '@squircle-icons/svelte/arrow-up-left';
  import FilledArrowUpLeft from '@squircle-icons/svelte/filled/arrow-up-left';
  import ArrowUpRight from '@squircle-icons/svelte/arrow-up-right';
  import FilledArrowUpRight from '@squircle-icons/svelte/filled/arrow-up-right';
  import ArrowDownLeft from '@squircle-icons/svelte/arrow-down-left';
  import FilledArrowDownLeft from '@squircle-icons/svelte/filled/arrow-down-left';
  import ArrowDownRight from '@squircle-icons/svelte/arrow-down-right';
  import FilledArrowDownRight from '@squircle-icons/svelte/filled/arrow-down-right';
  const roundFive = [
    { name: 'arrow-up', label: 'Arrow Up', Outline: ArrowUp, Filled: FilledArrowUp },
    { name: 'arrow-down', label: 'Arrow Down', Outline: ArrowDown, Filled: FilledArrowDown },
    {
      name: 'arrow-up-left',
      label: 'Arrow Up Left',
      Outline: ArrowUpLeft,
      Filled: FilledArrowUpLeft,
    },
    {
      name: 'arrow-up-right',
      label: 'Arrow Up Right',
      Outline: ArrowUpRight,
      Filled: FilledArrowUpRight,
    },
    {
      name: 'arrow-down-left',
      label: 'Arrow Down Left',
      Outline: ArrowDownLeft,
      Filled: FilledArrowDownLeft,
    },
    {
      name: 'arrow-down-right',
      label: 'Arrow Down Right',
      Outline: ArrowDownRight,
      Filled: FilledArrowDownRight,
    },
  ];
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
<div data-testid="blank-labels"><Camera label="   " /><FilledCamera label="   " /></div>
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
<div data-testid="camera-outline-contour"><Camera size={96} /></div>
<div data-testid="camera-filled-contour"><FilledCamera size={96} /></div>
<div data-testid="folder-outline-contour"><Folder size={96} /></div>
<div data-testid="folder-filled-contour"><FilledFolder size={96} /></div>
<section class="rotation-sheet" data-testid="primary-rounded-sheet">
  <header>
    <span>PRIMARY PAIR / ROUNDER CORNERS</span>
    <h2>Camera & Folder</h2>
    <p>2px left/right · Natural horizontal proportions · No enclosing box</p>
  </header>
  <div class="rotation-grid">
    <h3>Camera</h3>
    <h3>Folder</h3>
    {#each ['outline', 'filled'] as style}
      <article>
        <Camera size={64} style={style as 'outline' | 'filled'} /><small>{style}</small>
        <div>
          {#each [16, 20, 24] as size}<Camera {size} style={style as 'outline' | 'filled'} />{/each}
        </div>
      </article>
      <article>
        <Folder size={64} style={style as 'outline' | 'filled'} /><small>{style}</small>
        <div>
          {#each [16, 20, 24] as size}<Folder {size} style={style as 'outline' | 'filled'} />{/each}
        </div>
      </article>
    {/each}
  </div>
</section>
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
<div data-testid="x-outline-contour"><X size={96} label="Outline X contour" /></div>
<div data-testid="x-filled-contour"><FilledX size={96} label="Filled X contour" /></div>
<div data-testid="search-outline-contour"><Search size={96} label="Outline Search contour" /></div>
<div data-testid="search-filled-contour">
  <FilledSearch size={96} label="Filled Search contour" />
</div>
<section class="rotation-sheet" data-testid="search-bold-sheet">
  <header>
    <span>BOLD FILLED / SEARCH</span>
    <h2>Search</h2>
    <p>Shared centerlines · Outline 1.75 / Filled Bold 2.5 · 2px Filled margins</p>
  </header>
  <div class="rotation-grid">
    {#each ['outline', 'filled'] as style}<article>
        <Search size={72} style={style as 'outline' | 'filled'} /><small>{style}</small>
        <div>
          {#each [16, 20, 24, 48] as size}<Search
              {size}
              style={style as 'outline' | 'filled'}
            />{/each}
        </div>
      </article>{/each}
  </div>
</section>
<div data-testid="copy-outline-contour"><Copy size={96} label="Outline Copy contour" /></div>
<div data-testid="copy-filled-contour"><FilledCopy size={96} label="Filled Copy contour" /></div>
<div data-testid="chevron-down-outline-contour">
  <ChevronDown size={96} label="Outline ChevronDown contour" />
</div>
<div data-testid="chevron-down-filled-contour">
  <FilledChevronDown size={96} label="Filled ChevronDown contour" />
</div>
<div data-testid="plus-outline-contour"><Plus size={96} label="Outline Plus contour" /></div>
<div data-testid="plus-filled-contour"><FilledPlus size={96} label="Filled Plus contour" /></div>
<div data-testid="check-outline-contour"><Check size={96} label="Outline Check contour" /></div>
<div data-testid="check-filled-contour"><FilledCheck size={96} label="Filled Check contour" /></div>
<div data-testid="chevron-up-outline-contour">
  <ChevronUp size={96} label="Outline ChevronUp contour" />
</div>
<div data-testid="chevron-up-filled-contour">
  <FilledChevronUp size={96} label="Filled ChevronUp contour" />
</div>

{#each ['light', 'dark'] as surface}
  <section
    class="round-three"
    class:dark={surface === 'dark'}
    data-testid={'round-three-' + surface}
  >
    <header>
      <span>ROUND 3 / 6 ICONS</span>
      <h2>Everyday actions.</h2>
      <p>Outline & Filled · Regular 1.75</p>
    </header>
    <div class="round-grid">
      {#each [{ name: 'X', Outline: X, Filled: FilledX }, { name: 'Copy', Outline: Copy, Filled: FilledCopy }, { name: 'Chevron Down', Outline: ChevronDown, Filled: FilledChevronDown }, { name: 'Plus', Outline: Plus, Filled: FilledPlus }, { name: 'Check', Outline: Check, Filled: FilledCheck }, { name: 'Chevron Up', Outline: ChevronUp, Filled: FilledChevronUp }] as item}
        <article>
          <h3>{item.name}</h3>
          <div class="round-main"><item.Outline size={48} /><item.Filled size={48} /></div>
          <div class="round-sizes">
            {#each [16, 20, 24] as size}<div>
                <item.Outline {size} /><item.Filled {size} /><small>{size}px</small>
              </div>{/each}
          </div>
        </article>
      {/each}
    </div>
  </section>
{/each}

<section class="rotation-sheet" data-testid="copy-review-sheet">
  <header>
    <span>ROUND 3 / COPY REVISION</span>
    <h2>Copy</h2>
    <p>Two separated junctions · Standard corners · Regular 1.75</p>
  </header>
  <div class="rotation-grid">
    {#each ['outline', 'filled'] as style}<article>
        <Copy size={72} style={style as 'outline' | 'filled'} /><small>{style}</small>
        <div>
          {#each [16, 20, 24, 48] as size}<Copy
              {size}
              style={style as 'outline' | 'filled'}
            />{/each}
        </div>
      </article>{/each}
  </div>
</section>
<section class="rotation-sheet" data-testid="plus-x-rotation-sheet">
  <header>
    <span>ROUND 3 / FILLED REVISION</span>
    <h2>Plus & X</h2>
    <p>Rounder box corners · Same glyph in both styles · Regular 1.75</p>
  </header>
  <div class="rotation-grid">
    <h3>Plus</h3>
    <h3>X</h3>
    {#each ['outline', 'filled'] as style}
      <article>
        <Plus size={64} style={style as 'outline' | 'filled'} /><small>{style}</small>
      </article>
      <article><X size={64} style={style as 'outline' | 'filled'} /><small>{style}</small></article>
    {/each}
  </div>
</section>

{#each roundFour as item}
  <div data-testid={item.name + '-outline-contour'}>
    <item.Outline size={96} label={'Outline ' + item.label + ' contour'} />
  </div>
  <div data-testid={item.name + '-filled-contour'}>
    <item.Filled size={96} label={'Filled ' + item.label + ' contour'} />
  </div>
{/each}
{#each ['light', 'dark'] as surface}
  <section
    class="round-three"
    class:dark={surface === 'dark'}
    data-testid={'round-four-' + surface}
  >
    <header>
      <span>ROUND 4 / 6 DRAFT ICONS</span>
      <h2>Navigation and files.</h2>
      <p>Outline & Filled · Regular 1.75</p>
    </header>
    <div class="round-grid">
      {#each roundFour as item}<article>
          <h3>{item.label}</h3>
          <div class="round-main"><item.Outline size={48} /><item.Filled size={48} /></div>
          <div class="round-sizes">
            {#each [16, 20, 24] as size}<div>
                <item.Outline {size} /><item.Filled {size} /><small>{size}px</small>
              </div>{/each}
          </div>
        </article>{/each}
    </div>
  </section>
{/each}

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

{#each roundFive as item}
  <div data-testid={item.name + '-outline-contour'}>
    <item.Outline size={96} label={'Outline ' + item.label + ' contour'} />
  </div>
  <div data-testid={item.name + '-filled-contour'}>
    <item.Filled size={96} label={'Filled ' + item.label + ' contour'} />
  </div>
{/each}
{#each ['light', 'dark'] as surface}
  <section
    class="round-three"
    class:dark={surface === 'dark'}
    data-testid={'round-five-' + surface}
  >
    <header>
      <span>ROUND 5 / COMPASS ARROWS</span>
      <h2>Six new directions</h2>
      <p>Equal shaft/head size · Regular 1.75 · Outline / Filled</p>
    </header>
    <div class="round-grid">
      {#each roundFive as item}
        <article>
          <h3>{item.label}</h3>
          <div class="round-main"><item.Outline size={64} /><item.Filled size={64} /></div>
          <div class="round-sizes">
            {#each [16, 20, 24, 48] as size}<div>
                <item.Outline {size} /><item.Filled {size} /><small>{size}px</small>
              </div>{/each}
          </div>
        </article>
      {/each}
    </div>
  </section>
{/each}

<style>
  .rotation-sheet {
    width: 700px;
    padding: 28px;
    margin: 32px 0;
    color: #27272a;
    background: #fff;
    border: 1px solid #e4e4e7;
    border-radius: 16px;
  }
  .rotation-sheet header > span {
    color: #6366f1;
    letter-spacing: 0.12em;
    font-size: 11px;
    font-weight: 600;
  }
  .rotation-sheet h2 {
    margin: 8px 0 6px;
    font-size: 26px;
    letter-spacing: -0.04em;
  }
  .rotation-sheet p {
    margin: 0 0 22px;
    color: #92929e;
    font-size: 12px;
  }
  .rotation-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .rotation-grid h3 {
    margin: 0 0 2px;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
  }
  .rotation-grid article {
    display: grid;
    justify-items: center;
    gap: 18px;
    padding: 20px;
    border: 1px solid #e4e4e7;
    border-radius: 10px;
  }
  .rotation-grid small {
    font-size: 10px;
    color: #92929e;
  }

  .round-three {
    width: 850px;
    padding: 28px;
    margin: 32px 0;
    color: #27272a;
    background: #fff;
    border: 1px solid #e4e4e7;
    border-radius: 16px;
  }
  .round-three.dark {
    color: #f4f4f5;
    background: #1c1c22;
    border-color: #353540;
  }
  .round-three header > span {
    color: #6366f1;
    letter-spacing: 0.12em;
    font-size: 11px;
    font-weight: 600;
  }
  .round-three h2 {
    font-size: 26px;
    margin: 8px 0 6px;
    letter-spacing: -0.04em;
  }
  .round-three p {
    margin: 0 0 22px;
    font-size: 12px;
    color: #92929e;
  }
  .round-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
  .round-three article {
    border: 1px solid #e4e4e7;
    border-radius: 10px;
    padding: 16px;
  }
  .round-three.dark article {
    border-color: #353540;
  }
  .round-three h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
  }
  .round-main {
    display: flex;
    justify-content: center;
    gap: 28px;
    padding: 22px 0;
  }
  .round-sizes {
    display: flex;
    justify-content: space-between;
    align-items: end;
  }
  .round-sizes > div {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    gap: 5px;
  }
  .round-sizes small {
    grid-column: 1 / -1;
    font-size: 9px;
    color: #92929e;
    text-align: center;
  }

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
