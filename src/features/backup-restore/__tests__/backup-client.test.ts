import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DefaultBackupClient } from "@/features/backup-restore/application/default-backup-client";
import type { BackupDocument } from "@/features/backup-restore/domain/backup-document";
import { type BackupPayloadV1 } from "@/features/backup-restore/domain/backup-payload-v1";
import { JsonBackupCodec } from "@/features/backup-restore/infrastructure/codecs/json-backup-codec";
import { ZodBackupValidator } from "@/features/backup-restore/infrastructure/validation/backup-validator";
import type { BackupIntegrity } from "@/features/backup-restore/ports/backup-integrity";

const fixturesDir = join(__dirname, "../__fixtures__");

function loadFixture(name: string): Uint8Array {
  return readFileSync(join(fixturesDir, name));
}

class StaticIntegrity implements BackupIntegrity {
  async calculateHash(_contents: Uint8Array): Promise<string> {
    return "fixture-hash";
  }

  async verifyHash(_contents: Uint8Array, expectedHash: string): Promise<boolean> {
    return expectedHash === "fixture-hash";
  }
}

function createTestClient(payload: BackupPayloadV1) {
  return new DefaultBackupClient({
    app: {
      appId: "com.vincentmukuna.owed",
      getAppVersion: () => "1.0.0",
      getBuildVersion: () => null,
    },
    source: {
      async getSourceMetadata() {
        return { databaseSchemaVersion: 5 };
      },
      async exportSnapshot() {
        return payload;
      },
    },
    codec: new JsonBackupCodec(),
    validator: new ZodBackupValidator(),
    integrity: new StaticIntegrity(),
    clock: {
      now: () => new Date("2026-07-10T12:00:00.000Z"),
    },
    idGenerator: {
      generate: () => "backup_1",
    },
  });
}

function emptyPayload(): BackupPayloadV1 {
  return {
    people: [],
    debts: [],
    payments: [],
    activityEvents: [],
    reminders: [],
    preferences: {
      settings: {},
      onboardingComplete: false,
    },
  };
}

describe("backup client", () => {
  it("creates a portable backup document from a source", async () => {
    const client = createTestClient(emptyPayload());
    const created = await client.create();

    expect(created.summary).toEqual({
      backupId: "backup_1",
      createdAt: "2026-07-10T12:00:00.000Z",
      formatVersion: 1,
      appVersion: "1.0.0",
      counts: {
        people: 0,
        debts: 0,
        payments: 0,
        activityEvents: 0,
        reminders: 0,
      },
    });
    expect(created.document.manifest.format).toBe("owed.backup");
    expect(created.document.payload.preferences.onboardingComplete).toBe(false);
    expect(created.bytes.byteLength).toBeGreaterThan(0);
  });

  it("inspects a created backup without modifying application state", async () => {
    const client = createTestClient(emptyPayload());
    const created = await client.create();
    const inspection = await client.inspect(created.bytes);

    expect(inspection.valid).toBe(true);
    expect(inspection.summary.backupId).toBe("backup_1");
    expect(inspection.warnings).toEqual([
      {
        code: "EMPTY_BACKUP",
        message: "The backup contains no records.",
      },
    ]);
  });

  it("returns non-throwing restore compatibility for invalid input", async () => {
    const client = createTestClient(emptyPayload());
    const result = await client.canRestore("{not json");

    expect(result.canRestore).toBe(false);
    expect(result.error?.code).toBe("INVALID_JSON");
  });

  it("rejects backups from a newer unsupported format version", async () => {
    const client = createTestClient(emptyPayload());
    const result = await client.canRestore(loadFixture("invalid-newer-schema.owedbackup"));

    expect(result.canRestore).toBe(false);
    expect(result.error?.code).toBe("INVALID_DOCUMENT");
  });

  it("rejects backups created for another app", async () => {
    const client = createTestClient(emptyPayload());
    const result = await client.canRestore(loadFixture("invalid-wrong-app.owedbackup"));

    expect(result.canRestore).toBe(false);
    expect(result.error?.code).toBe("INVALID_MANIFEST");
  });

  it("accepts a populated v1 fixture", async () => {
    const client = createTestClient(emptyPayload());
    const result = await client.canRestore(loadFixture("v1-populated.owedbackup"));

    expect(result.canRestore).toBe(true);
    expect(result.summary?.counts.people).toBe(1);
    expect(result.summary?.counts.debts).toBe(1);
  });

  it("encodes existing backup documents", async () => {
    const client = createTestClient(emptyPayload());
    const created = await client.create();
    const document: BackupDocument = created.document;
    const encoded = await client.encode(document);

    expect(encoded.byteLength).toBe(created.bytes.byteLength);
  });
});
