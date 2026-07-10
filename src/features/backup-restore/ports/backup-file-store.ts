export type StoredBackupFile = {
  uri: string;
  name: string;
  sizeBytes: number;
};

export type BackupFileInfo = {
  uri: string;
  name: string | null;
  sizeBytes: number;
  exists: boolean;
};

export type BackupFileStore = {
  write(name: string, contents: Uint8Array): Promise<StoredBackupFile>;
  read(uri: string): Promise<Uint8Array>;
  getInfo(uri: string): Promise<BackupFileInfo>;
  share(uri: string, options: { mimeType: string; dialogTitle?: string }): Promise<void>;
};
