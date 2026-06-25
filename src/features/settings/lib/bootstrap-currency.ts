import {
  loadPersistedSettings,
  saveDefaultCurrency,
} from "@/features/reminders/lib/reminder-storage";
import { detectCurrencyFromOs } from "@/features/settings/lib/detect-currency-from-os";

/** Persist OS-detected currency on first install when no preference exists yet. */
export async function bootstrapCurrency(): Promise<void> {
  const stored = await loadPersistedSettings();

  if (stored?.defaultCurrency !== undefined) {
    return;
  }

  await saveDefaultCurrency(detectCurrencyFromOs());
}
