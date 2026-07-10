export type BackupIntegrity = {
  calculateHash(contents: Uint8Array): Promise<string>;
  verifyHash(contents: Uint8Array, expectedHash: string): Promise<boolean>;
};
