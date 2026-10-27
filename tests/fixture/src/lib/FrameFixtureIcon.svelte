<script lang="ts">
  import * as icons from '@squircle-icons/svelte';
  import type { Component as StaticComponent, ComponentProps } from 'svelte';
  type StaticProps = ComponentProps<typeof icons.Plus>;
  let {
    name,
    frame = 'none',
    ...props
  }: StaticProps & {
    name: string;
    frame?: 'none' | 'square' | 'circle';
  } = $props();
  // Test controls select independently exported components, never a production frame prop.
  const Component = $derived.by(() => {
    const base = name
      .trim()
      .split(/[-\s]+/)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('');
    const suffix = frame === 'none' ? '' : frame === 'square' ? 'Square' : 'Circle';
    const exported = icons as unknown as Record<string, StaticComponent<StaticProps>>;
    const selected = exported[base + suffix];
    if (!selected) throw new Error(`Unknown fixture icon: ${name}`);
    return selected;
  });
</script>

<Component {...props} />
