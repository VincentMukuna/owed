import { describe, expect, it } from "vitest";

import { BackupError } from "@/features/backup-restore/domain/backup-error";
import { suggestBackupFileName } from "@/features/backup-restore/domain/backup-payload-v1";
import { JsonBackupCodec } from "@/features/backup-restore/infrastructure/codecs/json-backup-codec";

import { InMemoryBackupStore, createTestClient, decodeUtf8, emptyPayload } from "./test-utils";

describe("backup store", () => {
  it("writes and reads backup bytes", async () => {
    const store = new InMemoryBackupStore();
    const bytes = new Uint8Array([1, 2, 3]);

    const stored = await store.write("owed-backup-test.owedbackup", bytes);
    const read = await store.read(stored.uri);

    expect(stored).toEqual({
      uri: stored.uri,
      name: "owed-backup-test.owedbackup",
      sizeBytes: 3,
    });
    expect(read).toEqual(bytes);
  });

  it("reports file info for stored and missing files", async () => {
    const store = new InMemoryBackupStore();
    const stored = await store.write("info-test.owedbackup", new Uint8Array([9]));

    await expect(store.getInfo(stored.uri)).resolves.toEqual({
      uri: stored.uri,
      name: "info-test.owedbackup",
      sizeBytes: 1,
      exists: true,
    });
    await expect(store.getInfo("memory://missing")).resolves.toEqual({
      uri: "memory://missing",
      name: null,
      sizeBytes: 0,
      exists: false,
    });
  });

  it("returns null from pick when nothing was seeded", async () => {
    const store = new InMemoryBackupStore();

    await expect(store.pick()).resolves.toBeNull();
  });

  it("throws when reading an unknown uri", async () => {
    const store = new InMemoryBackupStore();

    await expect(store.read("memory://missing")).rejects.toMatchObject({
      code: "FILE_STORE_FAILED",
    });
    await expect(store.read("memory://missing")).rejects.toBeInstanceOf(BackupError);
  });
});

describe("backup filename helper", () => {
  it("uses a stable owed backup filename from createdAt", () => {
    expect(suggestBackupFileName("2026-07-10T12:34:56.789Z")).toBe(
      "owed-backup-2026-07-10T12-34-56-789Z.owedbackup",
    );
  });
});

describe("json backup codec", () => {
  it("round-trips documents with stable key ordering", async () => {
    const codec = new JsonBackupCodec();
    const client = createTestClient(emptyPayload());
    const created = await client.create();

    const decoded = await codec.decode(created.bytes);
    const reencoded = await codec.encode(decoded as typeof created.document);

    expect(decodeUtf8(reencoded)).toBe(decodeUtf8(created.bytes));
  });

  it("rejects invalid json", async () => {
    const codec = new JsonBackupCodec();

    await expect(codec.decode("{not json")).rejects.toMatchObject({
      code: "INVALID_JSON",
    });
  });
});
