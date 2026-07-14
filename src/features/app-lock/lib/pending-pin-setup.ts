export type PinSetupMode = "enable" | "change";

type PendingPinSetup = {
  pin: string;
  mode: PinSetupMode;
};

let pending: PendingPinSetup | null = null;

/** Holds the create-step PIN in memory between stack screens. Never put this in the URL. */
export function setPendingPinSetup(pin: string, mode: PinSetupMode): void {
  pending = { pin, mode };
}

export function getPendingPinSetup(): PendingPinSetup | null {
  return pending;
}

export function clearPendingPinSetup(): void {
  pending = null;
}
