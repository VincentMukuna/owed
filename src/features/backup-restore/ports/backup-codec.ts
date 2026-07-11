import type { BackupDocument } from "../domain/backup-document";

export type BackupCodec = {
  encode<TPayload>(document: BackupDocument<TPayload>): Promise<Uint8Array>;
  decode(input: Uint8Array | string): Promise<unknown>;
  encodePayloadForIntegrity(payload: unknown): Promise<Uint8Array>;
};
