import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const { fixture } = JSON.parse(
  await readFile(new URL('../.artifacts/fixture-location.json', import.meta.url), 'utf8'),
);
const child = spawn(
  'pnpm',
  ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'],
  { cwd: fixture, stdio: 'inherit' },
);
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => process.exit(code ?? 0));
