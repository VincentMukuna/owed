import type { QueryClient } from "@tanstack/react-query";

import type {
  BackupRestoreHook,
  BackupRestoreHookContext,
} from "../../ports/backup-restore-destination";

export class QueryCacheRestoreHook implements BackupRestoreHook {
  readonly name = "invalidate-caches";

  constructor(private readonly queryClient: QueryClient) {}

  async afterRestore(_context: BackupRestoreHookContext): Promise<void> {
    await this.queryClient.invalidateQueries();
  }
}
