/** Validate names before any generated files are written. */
export function componentNames(names: string[]): string[] {
  const used = new Set(['IconProps', 'IconStyle', 'IconStrokeWidth']);
  const files = new Set();
  return names.map((name) => {
    // Keep the removed Filled namespace reserved.
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name) || name === 'filled')
      throw new Error(`Invalid or reserved icon name: ${name}`);
    const component = name
      .split('-')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join('');
    if (used.has(component)) throw new Error(`Duplicate or reserved component name: ${component}`);
    if (files.has(component.toLowerCase()))
      throw new Error(`Duplicate component filename: ${component}`);
    files.add(component.toLowerCase());
    used.add(component);
    return component;
  });
}

/** Git paths must match generated casing even on case-insensitive disks. */
export function assertGeneratedPathCase(tracked: string[], generated: Iterable<string>): void {
  const expected = new Map([...generated].map((path) => [path.toLowerCase(), path]));
  for (const path of tracked) {
    const target = expected.get(path.toLowerCase());
    if (target && target !== path)
      throw new Error(
        `Git tracks ${path}, but generation requires ${target}. Rename it through a temporary filename with git mv.`,
      );
  }
}
