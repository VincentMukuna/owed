import { DefaultBackupClient } from "@/features/backup-restore/client/default-backup-client";
import type { AfterRestoreAction } from "@/features/backup-restore/client/prepared-restore-operation";
import type { BackupDocument } from "@/features/backup-restore/domain/backup-document";
import { BackupError } from "@/features/backup-restore/domain/backup-error";
import type { BackupIntegrity } from "@/features/backup-restore/domain/backup-integrity";
import type { BackupPayloadV1 } from "@/features/backup-restore/domain/backup-payload-v1";
import type {
  BackupStore,
  StoredBackup,
  StoredBackupInfo,
} from "@/features/backup-restore/files/backup-store";
import { JsonBackupCodec } from "@/features/backup-restore/files/json-backup-codec";
import type { BackupSnapshot } from "@/features/backup-restore/persistence/backup-snapshot";

export const fixtureIntegrity: BackupIntegrity = {
  async calculateHash(_contents: Uint8Array): Promise<string> {
    return "fixture-hash";
  },

  async verifyHash(_contents: Uint8Array, expectedHash: string): Promise<boolean> {
    return expectedHash === "fixture-hash";
  },
};

export class InMemoryBackupStore implements BackupStore {
  private readonly files = new Map<string, Uint8Array>();
  private pickable: StoredBackup | null = null;

  async write(name: string, contents: Uint8Array): Promise<StoredBackup> {
    const uri = `memory://${encodeURIComponent(name)}`;
    this.files.set(uri, contents);

    return {
      uri,
      name,
      sizeBytes: contents.byteLength,
    };
  }

  async read(uri: string): Promise<Uint8Array> {
    const contents = this.files.get(uri);

    if (!contents) {
      throw new BackupError("FILE_STORE_FAILED", "The backup file could not be read.");
    }

    return contents;
  }

  async pick(): Promise<StoredBackup | null> {
    return this.pickable;
  }

  seedPickable(file: StoredBackup, contents: Uint8Array): void {
    this.files.set(file.uri, contents);
    this.pickable = file;
  }

  async getInfo(uri: string): Promise<StoredBackupInfo> {
    const contents = this.files.get(uri);

    return {
      uri,
      name: contents ? decodeURIComponent(uri.replace("memory://", "")) : null,
      sizeBytes: contents?.byteLength ?? 0,
      exists: contents !== undefined,
    };
  }
}

export function populatedPayload(): BackupPayloadV1 {
  return {
    people: [
      {
        id: "person_1",
        name: "Avery Stone",
        phoneNumber: null,
        notes: null,
        createdAt: "2026-07-01T09:00:00.000Z",
        updatedAt: "2026-07-01T09:00:00.000Z",
      },
    ],
    debts: [],
    payments: [],
    activityEvents: [],
    reminders: [],
    preferences: {
      settings: {},
      onboardingComplete: true,
    },
  };
}

export function emptyPayload(): BackupPayloadV1 {
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

type CreateTestClientOptions = {
  snapshot?: BackupSnapshot;
  afterRestore?: AfterRestoreAction[];
  exportSnapshot?: () => Promise<BackupPayloadV1>;
};

function createDefaultSnapshot(
  payload: BackupPayloadV1,
  options: CreateTestClientOptions,
): BackupSnapshot {
  if (options.snapshot) {
    return options.snapshot;
  }

  return {
    async getMetadata() {
      return { databaseSchemaVersion: 5 };
    },
    async exportSnapshot() {
      if (options.exportSnapshot) {
        return options.exportSnapshot();
      }

      return payload;
    },
    async getCurrentRecordCounts() {
      return {
        people: 0,
        debts: 0,
        payments: 0,
        activityEvents: 0,
        reminders: 0,
      };
    },
    async replaceSnapshot(restoredPayload) {
      return {
        people: restoredPayload.people.length,
        debts: restoredPayload.debts.length,
        payments: restoredPayload.payments.length,
        activityEvents: restoredPayload.activityEvents.length,
        reminders: restoredPayload.reminders.length,
      };
    },
  };
}

export function createTestClient(
  payload: BackupPayloadV1 = emptyPayload(),
  options: CreateTestClientOptions = {},
) {
  return new DefaultBackupClient({
    app: {
      appId: "com.vincentmukuna.owed",
      getAppVersion: () => "1.0.0",
      getBuildVersion: () => null,
    },
    snapshot: createDefaultSnapshot(payload, options),
    codec: new JsonBackupCodec(),
    integrity: fixtureIntegrity,
    afterRestore: options.afterRestore ?? [],
    clock: {
      now: () => new Date("2026-07-10T12:00:00.000Z"),
    },
    idGenerator: {
      generate: () => "backup_1",
    },
  });
}

const codec = new JsonBackupCodec();

export async function encodeTamperedDocument(
  document: BackupDocument,
  mutate: (doc: BackupDocument) => void,
): Promise<Uint8Array> {
  const copy = structuredClone(document);
  mutate(copy);
  return codec.encode(copy);
}

export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
