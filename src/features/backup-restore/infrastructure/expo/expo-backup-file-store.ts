import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { BackupError } from "../../domain/backup-error";
import type {
  BackupFileInfo,
  BackupFileStore,
  StoredBackupFile,
} from "../../ports/backup-file-store";

export class ExpoBackupFileStore implements BackupFileStore {
  async write(name: string, contents: Uint8Array): Promise<StoredBackupFile> {
    try {
      const file = new File(Paths.cache, name);

      if (file.exists) {
        file.delete();
      }

      file.create();
      file.write(contents);

      return {
        uri: file.uri,
        name,
        sizeBytes: contents.byteLength,
      };
    } catch (error) {
      throw new BackupError("FILE_STORE_FAILED", "The backup file could not be written.", error);
    }
  }

  async read(uri: string): Promise<Uint8Array> {
    try {
      const file = new File(uri);
      return await file.bytes();
    } catch (error) {
      throw new BackupError("FILE_STORE_FAILED", "The backup file could not be read.", error);
    }
  }

  async getInfo(uri: string): Promise<BackupFileInfo> {
    const file = new File(uri);

    return {
      uri,
      name: file.name,
      sizeBytes: file.size,
      exists: file.exists,
    };
  }

  async share(uri: string, options: { mimeType: string; dialogTitle?: string }): Promise<void> {
    const available = await Sharing.isAvailableAsync();

    if (!available) {
      throw new BackupError("FILE_STORE_FAILED", "Native sharing is not available on this device.");
    }

    await Sharing.shareAsync(uri, {
      dialogTitle: options.dialogTitle,
      mimeType: options.mimeType,
    });
  }
}
