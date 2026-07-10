import * as Crypto from "expo-crypto";

import type { BackupIntegrity } from "../../ports/backup-integrity";

export class Sha256BackupIntegrity implements BackupIntegrity {
  async calculateHash(contents: Uint8Array): Promise<string> {
    const data = Uint8Array.from(contents);
    const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async verifyHash(contents: Uint8Array, expectedHash: string): Promise<boolean> {
    const actualHash = await this.calculateHash(contents);
    return actualHash === expectedHash;
  }
}
