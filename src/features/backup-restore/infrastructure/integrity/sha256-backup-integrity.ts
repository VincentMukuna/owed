import * as Crypto from "expo-crypto";

import type { BackupIntegrity } from "../../ports/backup-integrity";

export class Sha256BackupIntegrity implements BackupIntegrity {
  async calculateHash(contents: Uint8Array): Promise<string> {
    const buffer = contents.buffer.slice(
      contents.byteOffset,
      contents.byteOffset + contents.byteLength,
    ) as ArrayBuffer;
    const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, buffer);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async verifyHash(contents: Uint8Array, expectedHash: string): Promise<boolean> {
    const actualHash = await this.calculateHash(contents);
    return actualHash === expectedHash;
  }
}
