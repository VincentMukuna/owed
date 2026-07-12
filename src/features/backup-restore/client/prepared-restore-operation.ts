import type { BackupInspection } from "../domain/backup-document";
import { BackupError } from "../domain/backup-error";
import type { BackupPayloadV1, BackupRecordCounts } from "../domain/backup-payload-v1";
import type { BackupSnapshot } from "../persistence/backup-snapshot";
import type {
  CommitRestoreOptions,
  CreatedBackup,
  PreparedRestore,
  RestorePlan,
  RestoreResult,
} from "../public/types";

export type AfterRestoreContext = {
  restoredCounts: BackupRecordCounts;
};

export type AfterRestoreAction = {
  name: string;
  run(context: AfterRestoreContext): Promise<void>;
};

type PreparedRestoreOperationOptions = {
  inspection: BackupInspection;
  plan: RestorePlan;
  snapshot: BackupSnapshot;
  afterRestore: AfterRestoreAction[];
  createSafetyBackup: (restoringBackupId: string) => Promise<CreatedBackup>;
  now: () => Date;
};

export class PreparedRestoreOperation implements PreparedRestore {
  readonly inspection: BackupInspection;
  readonly plan: RestorePlan;

  private disposed = false;
  private committed = false;
  private payload: BackupPayloadV1 | null;

  constructor(private readonly options: PreparedRestoreOperationOptions) {
    this.inspection = options.inspection;
    this.plan = options.plan;
    this.payload = options.inspection.payload;
  }

  dispose(): void {
    this.disposed = true;
    this.payload = null;
  }

  async commit(options: CommitRestoreOptions = {}): Promise<RestoreResult> {
    if (this.disposed || !this.payload) {
      throw new BackupError(
        "PREPARED_RESTORE_DISPOSED",
        "This prepared restore operation has been disposed.",
      );
    }

    if (this.committed) {
      throw new BackupError(
        "PREPARED_RESTORE_ALREADY_COMMITTED",
        "This prepared restore operation has already been committed.",
      );
    }

    if (!options.allowWarnings && this.inspection.warnings.length > 0) {
      throw new BackupError("WARNINGS_NOT_ALLOWED", "The backup has warnings.");
    }

    this.committed = true;

    let safetyBackup: CreatedBackup | undefined;
    if (options.createSafetyBackup ?? true) {
      safetyBackup = await this.options.createSafetyBackup(this.inspection.summary.backupId);
    }

    let restoredCounts;
    try {
      restoredCounts = await this.options.snapshot.replaceSnapshot(this.payload, {
        signal: options.signal,
      });
    } catch (error) {
      throw new BackupError("DATABASE_RESTORE_FAILED", "The backup could not be restored.", error);
    }

    const warnings = [...this.inspection.warnings];
    for (const action of this.options.afterRestore) {
      try {
        await action.run({ restoredCounts });
      } catch (error) {
        warnings.push({
          code: "POST_RESTORE_HOOK_FAILED",
          message: `Post-restore hook failed: ${action.name}`,
          details: { hook: action.name, error },
        });
      }
    }

    this.dispose();

    return {
      status: "restored",
      restoredAt: this.options.now().toISOString(),
      source: this.inspection.summary,
      restoredCounts,
      safetyBackup,
      warnings,
    };
  }
}
