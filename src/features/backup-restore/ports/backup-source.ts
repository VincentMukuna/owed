export type BackupOperationContext = {
  signal?: AbortSignal;
};

export type BackupSourceMetadata = {
  databaseSchemaVersion: number;
};

export type BackupSource<TPayload> = {
  getSourceMetadata(): Promise<BackupSourceMetadata>;
  exportSnapshot(context: BackupOperationContext): Promise<TPayload>;
};
