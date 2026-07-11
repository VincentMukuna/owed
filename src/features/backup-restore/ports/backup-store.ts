export type StoredBackup = {
  uri: string;
  name: string;
  sizeBytes: number;
};

export type StoredBackupInfo = {
  uri: string;
  name: string | null;
  sizeBytes: number;
  exists: boolean;
};

export type BackupStore = {
  write(name: string, contents: Uint8Array): Promise<StoredBackup>;
  pick(): Promise<StoredBackup | null>;
  read(uri: string): Promise<Uint8Array>;
  getInfo(uri: string): Promise<StoredBackupInfo>;
};
