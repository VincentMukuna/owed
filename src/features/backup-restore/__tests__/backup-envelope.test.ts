import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  createBackupFilename,
  serializeBackupEnvelope,
  validateBackupEnvelope,
} from "@/features/backup-restore/lib/backup-envelope";

const fixturesDir = join(__dirname, "../__fixtures__");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

describe("backup envelope validation", () => {
  it("accepts an empty v1 Owed backup", () => {
    const result = validateBackupEnvelope(loadFixture("v1-empty.owedbackup"));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.database.people).toEqual([]);
      expect(result.backup.data.preferences.onboardingComplete).toBe(false);
    }
  });

  it("accepts a populated v1 Owed backup", () => {
    const result = validateBackupEnvelope(loadFixture("v1-populated.owedbackup"));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.database.people).toHaveLength(1);
      expect(result.backup.data.database.debts[0]?.direction).toBe("they_owe_me");
      expect(result.backup.data.preferences.settings.overdueReminderEnabled).toBe(true);
    }
  });

  it("rejects backups from another app", () => {
    const result = validateBackupEnvelope(loadFixture("invalid-wrong-app.owedbackup"));

    expect(result).toEqual({ ok: false, reason: "wrong-app" });
  });

  it("rejects backups from a newer unsupported backup schema", () => {
    const result = validateBackupEnvelope(loadFixture("invalid-newer-schema.owedbackup"));

    expect(result).toEqual({ ok: false, reason: "unsupported-newer-schema" });
  });

  it("rejects malformed contents", () => {
    const result = validateBackupEnvelope({ metadata: { appId: "owed", backupSchemaVersion: 1 } });

    expect(result).toEqual({ ok: false, reason: "malformed" });
  });

  it("builds a stable user-facing backup filename", () => {
    const filename = createBackupFilename(new Date("2026-07-10T23:30:00.000Z"));

    expect(filename).toBe("owed-backup-2026-07-10.owedbackup");
  });

  it("serializes backup files as readable JSON with a trailing newline", () => {
    const fixture = loadFixture("v1-empty.owedbackup");
    const result = validateBackupEnvelope(fixture);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(serializeBackupEnvelope(result.backup)).toMatch(/^\{\n {2}"metadata":/);
      expect(serializeBackupEnvelope(result.backup)).toMatch(/\n$/);
    }
  });
});
