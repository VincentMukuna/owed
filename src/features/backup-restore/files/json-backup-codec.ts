import type { BackupDocument } from "../domain/backup-document";
import { BackupError } from "../domain/backup-error";

export type BackupCodec = {
  encode<TPayload>(document: BackupDocument<TPayload>): Promise<Uint8Array>;
  decode(input: Uint8Array | string): Promise<unknown>;
  encodePayloadForIntegrity(payload: unknown): Promise<Uint8Array>;
};

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = sortValue((value as Record<string, unknown>)[key]);
        return sorted;
      }, {});
  }

  return value;
}

function stableStringify(value: unknown): string {
  return `${JSON.stringify(sortValue(value), null, 2)}\n`;
}

export class JsonBackupCodec implements BackupCodec {
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  async encode<TPayload>(document: BackupDocument<TPayload>): Promise<Uint8Array> {
    return this.encoder.encode(stableStringify(document));
  }

  async decode(input: Uint8Array | string): Promise<unknown> {
    const text = typeof input === "string" ? input : this.decoder.decode(input);

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new BackupError("INVALID_JSON", "The backup file is not valid JSON.", error);
    }
  }

  async encodePayloadForIntegrity(payload: unknown): Promise<Uint8Array> {
    return this.encoder.encode(stableStringify(payload));
  }
}

export const jsonBackupCodec = new JsonBackupCodec();
