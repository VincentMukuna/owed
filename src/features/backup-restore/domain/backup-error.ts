export type BackupErrorCode =
  | "INVALID_INPUT"
  | "INVALID_JSON"
  | "INVALID_DOCUMENT"
  | "INVALID_MANIFEST"
  | "INVALID_PAYLOAD"
  | "UNSUPPORTED_FORMAT"
  | "UNSUPPORTED_VERSION"
  | "UNSUPPORTED_ENCODING"
  | "UNSUPPORTED_HASH_ALGORITHM"
  | "CHECKSUM_MISMATCH"
  | "PAYLOAD_LENGTH_MISMATCH"
  | "COUNT_MISMATCH"
  | "SOURCE_EXPORT_FAILED"
  | "FILE_STORE_FAILED";

export class BackupError extends Error {
  constructor(
    public readonly code: BackupErrorCode,
    message: string,
    public readonly cause?: unknown,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "BackupError";
  }
}

export type BackupFailure = {
  code: BackupErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export function normalizeBackupFailure(error: unknown): BackupFailure {
  if (error instanceof BackupError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  return {
    code: "INVALID_INPUT",
    message: "The backup could not be processed.",
  };
}
