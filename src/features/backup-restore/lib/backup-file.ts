import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import {
  type BackupEnvelope,
  createBackupFilename,
  serializeBackupEnvelope,
} from "./backup-envelope";
import { createBackupEnvelope } from "./create-backup";

export const BACKUP_MIME_TYPE = "application/json";

type BackupFile = {
  filename: string;
  uri: string;
  backup: BackupEnvelope;
};

type PrepareBackupFileOptions = {
  now?: Date;
  appVersion?: string;
};

export async function prepareBackupFile(
  options: PrepareBackupFileOptions = {},
): Promise<BackupFile> {
  const now = options.now ?? new Date();
  const backup = await createBackupEnvelope({ ...options, now });
  const filename = createBackupFilename(now);
  const file = new File(Paths.cache, filename);

  if (file.exists) {
    file.delete();
  }

  file.create();
  file.write(serializeBackupEnvelope(backup));

  return {
    filename,
    uri: file.uri,
    backup,
  };
}

export async function shareBackupFile(options: PrepareBackupFileOptions = {}): Promise<BackupFile> {
  const backupFile = await prepareBackupFile(options);
  const available = await Sharing.isAvailableAsync();

  if (!available) {
    throw new Error("Native sharing is not available on this device.");
  }

  await Sharing.shareAsync(backupFile.uri, {
    dialogTitle: "Save Owed backup",
    mimeType: BACKUP_MIME_TYPE,
  });

  return backupFile;
}
