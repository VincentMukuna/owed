import {
  type BackupDocument,
  type BackupInspection,
  type BackupManifest,
  createBackupSummary,
} from "../domain/backup-document";
import { BackupError, normalizeBackupFailure } from "../domain/backup-error";
import {
  BACKUP_FORMAT,
  BACKUP_SDK_VERSION,
  type BackupPayloadV1,
  CURRENT_BACKUP_FORMAT_VERSION,
  calculateRecordCounts,
} from "../domain/backup-payload-v1";
import type { BackupCodec } from "../ports/backup-codec";
import type { BackupIntegrity } from "../ports/backup-integrity";
import type { BackupSource } from "../ports/backup-source";
import type { BackupValidator } from "../ports/backup-validator";
import type {
  BackupClient,
  BackupInput,
  CanRestoreResult,
  CreateBackupOptions,
  CreatedBackup,
} from "../public/types";

type BackupAppInfo = {
  appId: string;
  getAppVersion: () => string;
  getBuildVersion: () => string | null;
};

type Clock = {
  now: () => Date;
};

type IdGenerator = {
  generate: () => string;
};

type DefaultBackupClientOptions = {
  app: BackupAppInfo;
  source: BackupSource<BackupPayloadV1>;
  codec: BackupCodec;
  validator: BackupValidator<BackupPayloadV1>;
  integrity: BackupIntegrity;
  clock: Clock;
  idGenerator: IdGenerator;
};

function assertCountsMatch(manifest: BackupManifest, payload: BackupPayloadV1): void {
  const actual = calculateRecordCounts(payload);

  if (JSON.stringify(actual) !== JSON.stringify(manifest.payload.counts)) {
    throw new BackupError("COUNT_MISMATCH", "The backup record counts do not match the payload.");
  }
}

function buildWarnings(payload: BackupPayloadV1) {
  const counts = calculateRecordCounts(payload);

  if (
    counts.people === 0 &&
    counts.debts === 0 &&
    counts.payments === 0 &&
    counts.activityEvents === 0 &&
    counts.reminders === 0
  ) {
    return [
      {
        code: "EMPTY_BACKUP" as const,
        message: "The backup contains no records.",
      },
    ];
  }

  return [];
}

export class DefaultBackupClient implements BackupClient {
  constructor(private readonly options: DefaultBackupClientOptions) {}

  async create(options: CreateBackupOptions = {}): Promise<CreatedBackup> {
    const sourceMetadata = await this.options.source.getSourceMetadata();
    const payload = this.options.validator.validateCurrentPayload(
      await this.options.source.exportSnapshot({ signal: options.signal }),
    );
    const payloadBytes = await this.options.codec.encodePayloadForIntegrity(payload);
    const hash = await this.options.integrity.calculateHash(payloadBytes);
    const document: BackupDocument<BackupPayloadV1> = {
      manifest: {
        format: BACKUP_FORMAT,
        formatVersion: CURRENT_BACKUP_FORMAT_VERSION,
        backupId: this.options.idGenerator.generate(),
        createdAt: this.options.clock.now().toISOString(),
        producer: {
          appId: this.options.app.appId,
          appVersion: this.options.app.getAppVersion(),
          buildVersion: this.options.app.getBuildVersion(),
          sdkVersion: BACKUP_SDK_VERSION,
        },
        source: {
          databaseSchemaVersion: sourceMetadata.databaseSchemaVersion,
        },
        payload: {
          encoding: "json",
          hashAlgorithm: "sha256",
          hash,
          byteLength: payloadBytes.byteLength,
          counts: calculateRecordCounts(payload),
        },
        metadata: options.metadata,
      },
      payload,
    };
    const bytes = await this.encode(document);

    return {
      document,
      bytes,
      summary: createBackupSummary(document.manifest),
    };
  }

  async encode(backup: BackupDocument): Promise<Uint8Array> {
    return this.options.codec.encode(backup);
  }

  async inspect(input: BackupInput): Promise<BackupInspection> {
    const decoded =
      typeof input === "string" || input instanceof Uint8Array
        ? await this.options.codec.decode(input)
        : input;
    const document = this.options.validator.validateDocument(decoded);
    const payloadBytes = await this.options.codec.encodePayloadForIntegrity(document.payload);

    if (document.manifest.producer.appId !== this.options.app.appId) {
      throw new BackupError("INVALID_MANIFEST", "The backup was created for another app.");
    }

    if (payloadBytes.byteLength !== document.manifest.payload.byteLength) {
      throw new BackupError(
        "PAYLOAD_LENGTH_MISMATCH",
        "The backup payload length does not match the manifest.",
      );
    }

    const hashMatches = await this.options.integrity.verifyHash(
      payloadBytes,
      document.manifest.payload.hash,
    );

    if (!hashMatches) {
      throw new BackupError("CHECKSUM_MISMATCH", "The backup payload checksum does not match.");
    }

    assertCountsMatch(document.manifest, document.payload);

    return {
      valid: true,
      originalManifest: document.manifest,
      normalizedManifest: document.manifest,
      payload: document.payload,
      summary: createBackupSummary(document.manifest),
      compatibility: {
        canRestore: true,
        requiresMigration: false,
        sourceFormatVersion: document.manifest.formatVersion,
        targetFormatVersion: CURRENT_BACKUP_FORMAT_VERSION,
      },
      warnings: buildWarnings(document.payload),
    };
  }

  async canRestore(input: BackupInput): Promise<CanRestoreResult> {
    try {
      const inspection = await this.inspect(input);

      return {
        canRestore: inspection.compatibility.canRestore,
        summary: inspection.summary,
        warnings: inspection.warnings,
      };
    } catch (error) {
      return {
        canRestore: false,
        warnings: [],
        error: normalizeBackupFailure(error),
      };
    }
  }
}
