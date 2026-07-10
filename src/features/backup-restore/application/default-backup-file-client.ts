import { BACKUP_FILE_EXTENSION, BACKUP_MIME_TYPE } from "../domain/backup-payload-v1";
import type { BackupFileStore } from "../ports/backup-file-store";
import type {
  BackupClient,
  BackupFile,
  BackupFileClient,
  BackupInspection,
  CreateBackupOptions,
} from "../public/types";

type DefaultBackupFileClientOptions = {
  backup: BackupClient;
  files: BackupFileStore;
};

function createBackupFileName(createdAt: string): string {
  const timestamp = new Date(createdAt).toISOString().replace(/[:.]/g, "-");
  return `owed-backup-${timestamp}.${BACKUP_FILE_EXTENSION}`;
}

export class DefaultBackupFileClient implements BackupFileClient {
  constructor(private readonly options: DefaultBackupFileClientOptions) {}

  async createFile(options?: CreateBackupOptions): Promise<BackupFile> {
    const created = await this.options.backup.create(options);
    const name = createBackupFileName(created.summary.createdAt);
    const stored = await this.options.files.write(name, created.bytes);

    return {
      ...stored,
      summary: created.summary,
    };
  }

  async pickFile(): Promise<BackupFile | null> {
    const stored = await this.options.files.pick();

    if (!stored) {
      return null;
    }

    const inspection = await this.inspectFile(stored.uri);

    return {
      ...stored,
      summary: inspection.summary,
    };
  }

  async share(file: BackupFile): Promise<void> {
    await this.options.files.share(file.uri, {
      dialogTitle: "Save Owed backup",
      mimeType: BACKUP_MIME_TYPE,
    });
  }

  async inspectFile(uri: string): Promise<BackupInspection> {
    const bytes = await this.options.files.read(uri);
    return this.options.backup.inspect(bytes);
  }

  async prepareRestoreFile(uri: string, options?: Parameters<BackupClient["prepareRestore"]>[1]) {
    const bytes = await this.options.files.read(uri);
    return this.options.backup.prepareRestore(bytes, options);
  }

  async restoreFile(uri: string, options?: Parameters<BackupClient["restore"]>[1]) {
    const bytes = await this.options.files.read(uri);
    return this.options.backup.restore(bytes, options);
  }
}
