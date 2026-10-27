import type { CoreIcon } from '@squircle-icons/core/catalog-types';

export type StaticIcon = Omit<CoreIcon, 'frames'> & {
  baseIcon: string;
  frame: 'none' | 'square' | 'circle';
};

/** Resolve authoring variants before code generation; runtime icons own one drawing only. */
export function flattenCoreIcons(sources: CoreIcon[]): StaticIcon[] {
  const icons: StaticIcon[] = [];
  for (const source of sources) {
    const { frames, ...base } = source;
    icons.push({ ...base, baseIcon: source.name, frame: 'none' });
    for (const frame of ['square', 'circle'] as const) {
      const variant = frames?.[frame];
      if (!variant) continue;
      const name = `${source.name}-${frame}`;
      icons.push({
        name,
        baseIcon: source.name,
        frame,
        metadata: { ...variant.metadata, name, supportsBold: false },
        root: variant.root,
        parts: variant.parts,
        filled: {
          ...variant.filled,
          metadata: { ...variant.filled.metadata, name, supportsBold: false },
        },
      });
    }
  }
  const names = icons.map((icon) => icon.name);
  if (new Set(names).size !== names.length)
    throw new Error('Explicit framed icon name collides with another source identity');
  return icons;
}
