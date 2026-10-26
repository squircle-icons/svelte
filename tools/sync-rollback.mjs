import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

/** Sync owns this checkout while it runs; use separate worktrees for parallel edits. */
export async function withRollback(root, paths, action, recover = async () => {}) {
  const backup = await mkdtemp(resolve(tmpdir(), 'squircle-sync-backup-'));
  const existing = new Set();
  let preserveBackup = false;
  try {
    for (const path of paths) {
      try {
        await cp(resolve(root, path), resolve(backup, path), { recursive: true });
        existing.add(path);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    try {
      return await action();
    } catch (error) {
      try {
        for (const path of paths) {
          await rm(resolve(root, path), { recursive: true, force: true });
          if (existing.has(path))
            await cp(resolve(backup, path), resolve(root, path), { recursive: true });
        }
        await recover();
      } catch (recoveryError) {
        preserveBackup = true;
        throw new AggregateError(
          [error, recoveryError],
          `Sync failed; backup preserved at ${backup}`,
        );
      }
      throw error;
    }
  } finally {
    if (!preserveBackup) await rm(backup, { recursive: true, force: true });
  }
}
