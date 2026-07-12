import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";

import { BackupError } from "../domain/backup-error";
import type { BackupStore, StoredBackup, StoredBackupInfo } from "./backup-store";

export class ExpoBackupStore implements BackupStore {
  async write(name: string, contents: Uint8Array): Promise<StoredBackup> {
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

  async pick(): Promise<StoredBackup | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/json", "*/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    if (!asset) {
      return null;
    }

    return {
      uri: asset.uri,
      name: asset.name,
      sizeBytes: asset.size ?? 0,
    };
  }

  async getInfo(uri: string): Promise<StoredBackupInfo> {
    const file = new File(uri);

    return {
      uri,
      name: file.name,
      sizeBytes: file.size,
      exists: file.exists,
    };
  }
}
