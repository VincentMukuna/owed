import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { BackupError } from "@/features/backup-restore/domain/backup-error";
import {
  type BackupPayloadV1,
  suggestBackupFileName,
} from "@/features/backup-restore/domain/backup-payload-v1";
import type {
  BackupPayloadRestoreDestination,
  BackupRestoreHook,
} from "@/features/backup-restore/ports/backup-restore-destination";

import {
  InMemoryBackupStore,
  createTestClient,
  emptyPayload,
  encodeTamperedDocument,
  populatedPayload,
} from "./test-utils";

const fixturesDir = join(__dirname, "../__fixtures__");

function loadFixture(name: string): Uint8Array {
  return readFileSync(join(fixturesDir, name));
}

function payloadWithPaymentTimestamp(): BackupPayloadV1 {
  return {
    ...populatedPayload(),
    payments: [
      {
        id: "payment_1",
        debtId: "debt_1",
        amount: 100,
        paidAt: "2026-07-05T10:00:00.000Z",
        note: null,
        createdAt: "2026-07-05T10:00:00.000Z",
      },
    ],
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

  it("accepts app-created payment timestamps in backup payloads", async () => {
    const client = createTestClient(payloadWithPaymentTimestamp());
    const created = await client.create();

    expect(created.document.payload.payments[0]?.paidAt).toBe("2026-07-05T10:00:00.000Z");
  });

  it("reports validation paths when a payload is invalid", async () => {
    const payload = payloadWithPaymentTimestamp();
    payload.payments[0] = {
      ...payload.payments[0]!,
      paidAt: "2026-07-05",
    };
    const client = createTestClient(payload);

    await expect(client.create()).rejects.toMatchObject({
      code: "INVALID_PAYLOAD",
      message: expect.stringContaining("payments.0.paidAt"),
    });

    try {
      await client.create();
    } catch (error) {
      expect(error).toBeInstanceOf(BackupError);
      expect((error as BackupError).details).toEqual({
        issues: expect.arrayContaining([
          expect.objectContaining({
            path: "payments.0.paidAt",
          }),
        ]),
      });
    }
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

  it("inspects backup documents and json strings directly", async () => {
    const client = createTestClient(populatedPayload());
    const created = await client.create();
    const json = new TextDecoder().decode(created.bytes);

    await expect(client.inspect(created.document)).resolves.toMatchObject({
      summary: { backupId: "backup_1" },
    });
    await expect(client.inspect(json)).resolves.toMatchObject({
      summary: { backupId: "backup_1" },
    });
  });

  it("stores caller metadata on created backups", async () => {
    const client = createTestClient(emptyPayload());
    const created = await client.create({
      metadata: {
        purpose: "manual_export",
      },
    });

    expect(created.document.manifest.metadata).toEqual({
      purpose: "manual_export",
    });
  });

  it("rejects malformed backup documents before restore", async () => {
    const client = createTestClient(emptyPayload());
    const malformed = new TextEncoder().encode(JSON.stringify({ unexpected: true }));

    await expect(client.inspect(malformed)).rejects.toMatchObject({
      code: "INVALID_DOCUMENT",
    });
    await expect(client.canRestore(malformed)).resolves.toMatchObject({
      canRestore: false,
      error: { code: "INVALID_DOCUMENT" },
    });
  });

  it("round-trips backup bytes through create, store, and restore", async () => {
    let currentPayload = populatedPayload();
    const destination: BackupPayloadRestoreDestination = {
      async getCurrentRecordCounts() {
        return {
          people: currentPayload.people.length,
          debts: currentPayload.debts.length,
          payments: currentPayload.payments.length,
          activityEvents: currentPayload.activityEvents.length,
          reminders: currentPayload.reminders.length,
        };
      },
      async replaceSnapshot(payload) {
        currentPayload = payload;
        return {
          people: payload.people.length,
          debts: payload.debts.length,
          payments: payload.payments.length,
          activityEvents: payload.activityEvents.length,
          reminders: payload.reminders.length,
        };
      },
    };

    const backups = createTestClient(currentPayload, {
      destination,
      exportSnapshot: async () => currentPayload,
    });
    const store = new InMemoryBackupStore();
    const exported = await backups.create();
    const stored = await store.write(
      suggestBackupFileName(exported.summary.createdAt),
      exported.bytes,
    );

    currentPayload = emptyPayload();
    const prepared = await backups.prepareRestore(await store.read(stored.uri));
    await prepared.commit({ createSafetyBackup: false });

    const reexported = await backups.create();
    expect(reexported.document.payload).toEqual(exported.document.payload);
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

  it("accepts populated and empty v1 fixtures", async () => {
    const client = createTestClient(emptyPayload());

    await expect(client.canRestore(loadFixture("v1-populated.owedbackup"))).resolves.toMatchObject({
      canRestore: true,
      summary: { counts: { people: 1, debts: 1 } },
    });
    await expect(client.canRestore(loadFixture("v1-empty.owedbackup"))).resolves.toMatchObject({
      canRestore: true,
      warnings: [
        {
          code: "EMPTY_BACKUP",
          message: "The backup contains no records.",
        },
      ],
    });
  });

  it("encodes existing backup documents", async () => {
    const client = createTestClient(emptyPayload());
    const created = await client.create();
    const encoded = await client.encode(created.document);

    expect(encoded.byteLength).toBe(created.bytes.byteLength);
  });

  it("rejects tampered checksums, payload lengths, and record counts", async () => {
    const client = createTestClient(populatedPayload());
    const created = await client.create();

    const checksumMismatch = await encodeTamperedDocument(created.document, (doc) => {
      doc.manifest.payload.hash = "not-the-real-hash";
    });
    await expect(client.inspect(checksumMismatch)).rejects.toMatchObject({
      code: "CHECKSUM_MISMATCH",
    });

    const lengthMismatch = await encodeTamperedDocument(created.document, (doc) => {
      doc.manifest.payload.byteLength = 1;
    });
    await expect(client.inspect(lengthMismatch)).rejects.toMatchObject({
      code: "PAYLOAD_LENGTH_MISMATCH",
    });

    const countMismatch = await encodeTamperedDocument(created.document, (doc) => {
      doc.manifest.payload.counts.people = 99;
    });
    await expect(client.inspect(countMismatch)).rejects.toMatchObject({
      code: "COUNT_MISMATCH",
    });
  });

  it("prepares restore without replacing data", async () => {
    let replaceCalls = 0;
    const destination: BackupPayloadRestoreDestination = {
      async getCurrentRecordCounts() {
        return {
          people: 9,
          debts: 8,
          payments: 7,
          activityEvents: 6,
          reminders: 5,
        };
      },
      async replaceSnapshot() {
        replaceCalls += 1;
        return {
          people: 1,
          debts: 0,
          payments: 0,
          activityEvents: 0,
          reminders: 0,
        };
      },
    };
    const client = createTestClient(populatedPayload(), { destination });
    const created = await client.create();
    const prepared = await client.prepareRestore(created.bytes);

    expect(replaceCalls).toBe(0);
    expect(prepared.plan).toEqual({
      mode: "replace",
      deleteCounts: {
        people: 9,
        debts: 8,
        payments: 7,
        activityEvents: 6,
        reminders: 5,
      },
      insertCounts: {
        people: 1,
        debts: 0,
        payments: 0,
        activityEvents: 0,
        reminders: 0,
      },
      postRestoreActions: [],
    });
  });

  it("throws when preparing restore from invalid backups", async () => {
    const client = createTestClient(emptyPayload());

    await expect(client.prepareRestore("{not json")).rejects.toMatchObject({
      code: "INVALID_JSON",
    });
  });

  it("commits a prepared restore with a safety backup", async () => {
    const restoredPayloads: BackupPayloadV1[] = [];
    const destination: BackupPayloadRestoreDestination = {
      async getCurrentRecordCounts() {
        return {
          people: 0,
          debts: 0,
          payments: 0,
          activityEvents: 0,
          reminders: 0,
        };
      },
      async replaceSnapshot(payload) {
        restoredPayloads.push(payload);
        return {
          people: payload.people.length,
          debts: payload.debts.length,
          payments: payload.payments.length,
          activityEvents: payload.activityEvents.length,
          reminders: payload.reminders.length,
        };
      },
    };
    const client = createTestClient(populatedPayload(), { destination });
    const created = await client.create();
    const prepared = await client.prepareRestore(created.bytes);
    const result = await prepared.commit();

    expect(restoredPayloads[0]?.people).toHaveLength(1);
    expect(result.status).toBe("restored");
    expect(result.safetyBackup?.document.manifest.metadata).toEqual({
      purpose: "pre_restore_safety",
      restoringBackupId: "backup_1",
    });
  });

  it("does not allow a prepared restore to commit twice", async () => {
    const client = createTestClient(populatedPayload());
    const created = await client.create();
    const prepared = await client.prepareRestore(created.bytes);

    await prepared.commit();
    await expect(prepared.commit()).rejects.toMatchObject({
      code: "PREPARED_RESTORE_DISPOSED",
    });
  });

  it("does not commit after dispose", async () => {
    const client = createTestClient(populatedPayload());
    const created = await client.create();
    const prepared = await client.prepareRestore(created.bytes);

    prepared.dispose();

    await expect(prepared.commit()).rejects.toMatchObject({
      code: "PREPARED_RESTORE_DISPOSED",
    });
  });

  it("rejects empty backups unless warnings are explicitly allowed", async () => {
    const client = createTestClient(emptyPayload());
    const created = await client.create();
    const prepared = await client.prepareRestore(created.bytes);

    await expect(prepared.commit()).rejects.toMatchObject({
      code: "WARNINGS_NOT_ALLOWED",
    });

    const allowed = await prepared.commit({ allowWarnings: true });
    expect(allowed.status).toBe("restored");
  });

  it("can skip safety backups and restore in one step", async () => {
    const client = createTestClient(populatedPayload());
    const created = await client.create();
    const prepared = await client.prepareRestore(created.bytes);

    const result = await prepared.commit({ createSafetyBackup: false });
    expect(result.safetyBackup).toBeUndefined();

    const restored = await client.restore(created.bytes, { createSafetyBackup: false });
    expect(restored.status).toBe("restored");
    expect(restored.safetyBackup).toBeUndefined();
  });

  it("surfaces post-restore hook failures as warnings without rolling back", async () => {
    const hook: BackupRestoreHook = {
      name: "failing-hook",
      async afterRestore() {
        throw new Error("hook failed");
      },
    };
    const client = createTestClient(populatedPayload(), { hooks: [hook] });
    const created = await client.create();
    const prepared = await client.prepareRestore(created.bytes);
    const result = await prepared.commit();

    expect(result.status).toBe("restored");
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "POST_RESTORE_HOOK_FAILED",
          message: "Post-restore hook failed: failing-hook",
        }),
      ]),
    );
  });

  it("fails restore when the database replacement fails", async () => {
    const destination: BackupPayloadRestoreDestination = {
      async getCurrentRecordCounts() {
        return {
          people: 0,
          debts: 0,
          payments: 0,
          activityEvents: 0,
          reminders: 0,
        };
      },
      async replaceSnapshot() {
        throw new Error("sqlite locked");
      },
    };
    const client = createTestClient(populatedPayload(), { destination });
    const created = await client.create();
    const prepared = await client.prepareRestore(created.bytes);

    await expect(prepared.commit()).rejects.toMatchObject({
      code: "DATABASE_RESTORE_FAILED",
    });
  });

  it("fails restore when the safety backup cannot be created", async () => {
    let exportCalls = 0;
    const client = createTestClient(populatedPayload(), {
      exportSnapshot: async () => {
        exportCalls += 1;
        if (exportCalls > 1) {
          throw new Error("export failed");
        }
        return populatedPayload();
      },
    });
    const created = await client.create();
    const prepared = await client.prepareRestore(created.bytes);

    await expect(prepared.commit()).rejects.toMatchObject({
      code: "SAFETY_BACKUP_FAILED",
    });
  });

  it("restores through the store read and write path used by settings", async () => {
    const restoredPayloads: BackupPayloadV1[] = [];
    const destination: BackupPayloadRestoreDestination = {
      async getCurrentRecordCounts() {
        return {
          people: 0,
          debts: 0,
          payments: 0,
          activityEvents: 0,
          reminders: 0,
        };
      },
      async replaceSnapshot(payload) {
        restoredPayloads.push(payload);
        return {
          people: payload.people.length,
          debts: payload.debts.length,
          payments: payload.payments.length,
          activityEvents: payload.activityEvents.length,
          reminders: payload.reminders.length,
        };
      },
    };
    const backups = createTestClient(populatedPayload(), { destination });
    const store = new InMemoryBackupStore();

    const created = await backups.create();
    const file = await store.write(suggestBackupFileName(created.summary.createdAt), created.bytes);
    const prepared = await backups.prepareRestore(await store.read(file.uri));

    await prepared.commit({ allowWarnings: true });

    expect(restoredPayloads[0]?.people).toHaveLength(1);
  });

  it("restores from a picked store file", async () => {
    const backups = createTestClient(populatedPayload());
    const store = new InMemoryBackupStore();
    const created = await backups.create();
    const file = await store.write("picked-backup.owedbackup", created.bytes);

    store.seedPickable(file, created.bytes);

    const picked = await store.pick();
    expect(picked).toEqual(file);

    const prepared = await backups.prepareRestore(await store.read(picked!.uri));
    const result = await prepared.commit();

    expect(result.status).toBe("restored");
  });
});
