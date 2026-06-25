# PRD: App Currency & Conversion (v1)

**Status:** Approved — ready for implementation  
**Baseline:** v0.4 reminders + People tab shipped  
**Scope:** Single app-wide currency with OS bootstrap, Settings picker, and one-shot conversion on change  
**Branch:** One feature branch (`feature/currency`)

**Related docs**

| Document | Role |
|----------|------|
| [prd.md](./prd.md) | Original product vision |
| [persistence-prd.md](./persistence-prd.md) | SQLite + React Query patterns |
| [performance.md](./performance.md) | Query invalidation rules |
| [reminders-grouping-prd.md](./reminders-grouping-prd.md) | Reminder copy uses `formatCurrency` — must re-sync after conversion |
| [design-brief.md](./design-brief.md) | Visual tone — calm, private, human |

**Expo version:** SDK 56 — add [`expo-localization`](https://docs.expo.dev/versions/v56.0.0/sdk/localization/) for OS locale detection.

---

## 1. Summary

Owed tracks all debts in **one currency**. Today that currency is hard-coded as **KES** (`APP_CONFIG.defaultCurrency`), with a read-only Settings row and per-debt `currency` columns that always match. Users cannot change currency, and several screens still hardcode the `KES` prefix.

v1 introduces:

1. **OS bootstrap** — on first install (no saved preference), silently detect currency from locale; fallback **USD** when ambiguous.
2. **Settings picker** — searchable full **ISO 4217** list; tap to select.
3. **Conversion on change** — when the user picks a different currency and **any debt exists**, prompt for an exchange rate (`1 OLD = ___ NEW`), show a **total-owed preview**, and on Confirm rewrite all monetary rows in SQLite inside one transaction.
4. **Display** — upgrade `formatCurrency` to `Intl.NumberFormat` with locale-aware symbols.

No live exchange rates. No multi-currency debts. No conversion audit trail.

---

## 2. Problem

- Kenyan shilling is baked in everywhere; international users see wrong defaults.
- Settings shows currency but cannot change it (`saveDefaultCurrency` exists but has no UI).
- `add-debt-screen`, `record-payment-screen`, and onboarding preview hardcode `KES`.
- Changing currency without converting amounts would corrupt totals, activity copy, and reminder notifications.

---

## 3. Goals

| # | Goal |
|---|------|
| G1 | Every monetary record uses the same currency code |
| G2 | Fresh installs get a sensible default from the OS without extra onboarding steps |
| G3 | Users can pick any ISO currency from Settings |
| G4 | Currency change with existing debts is safe: rate input → preview → confirm → atomic DB update |
| G5 | Amounts display with proper currency symbols via `Intl` |
| G6 | Reminders and activity copy reflect converted amounts after a currency change |

---

## 4. Non-goals (v1)

- Multiple currencies at once (per-debt currency override).
- Live or automatic exchange rates (API lookup).
- Storing historical exchange rates or conversion audit logs.
- Re-detecting OS currency for existing users on upgrade.
- Currency selection during onboarding (silent bootstrap only).
- Undo after conversion.
- Changing `APP_CONFIG.defaultCurrency` at runtime — it remains a compile-time fallback only.

---

## 5. Frozen design decisions

Agreed via grilling. Do not re-litigate without product sign-off.

| # | Topic | Decision |
|---|-------|----------|
| D1 | Fresh install, empty DB | Silently adopt OS locale currency — **no UI** |
| D2 | Exchange rate phrasing | Always anchored to currency being **left**: `1 KES = ___ USD` |
| D3 | Before DB write | Preview **total owed** before → after, then **Confirm** |
| D4 | Currency picker | Full **ISO 4217** list with **search** |
| D5 | Cancel conversion | **Full revert** — settings and DB unchanged |
| D6 | Existing users upgrading | Keep **persisted** `defaultCurrency`; OS detect only when **no saved preference** |
| D7 | OS detect fallback | **USD** when locale is ambiguous or maps to an unsupported code |
| D8 | Conversion scope | All `debts` (open + archived), all `payments`, all `activity_events` amounts, and `debts.currency` |
| D9 | Rate precision | Up to **8** decimal places; live preview as user types |
| D10 | "Has data" trigger | **Any row in `debts`** → conversion flow; empty debts table → instant save |
| D11 | Display format | **`Intl.NumberFormat`** with symbols; fallback to `{CODE} {amount}` if `Intl` fails |

---

## 6. User flows

### 6.1 App launch (bootstrap)

```
hydrateReminderSettings()
  → if persisted defaultCurrency exists → use it (D6)
  → else detectCurrencyFromOs() → validate ISO → saveDefaultCurrency() (D1, D7)
```

- Bootstrap runs during existing `_layout.tsx` startup alongside `hydrateReminderSettings()`.
- **Do not** prompt on launch. **Do not** convert on launch.
- If user has debts in DB but no persisted preference (edge case: data restore), treat as fresh bootstrap — save detected currency **without** conversion. Document as known edge case; out of scope to auto-detect mismatch.

### 6.2 Settings — change currency (no debts)

1. User taps **Default currency** row (currently read-only).
2. Searchable ISO picker sheet opens.
3. User selects new code (e.g. `USD`).
4. If `debts` table is empty → `saveDefaultCurrency(newCode)` immediately, sheet closes, row updates.

### 6.3 Settings — change currency (has debts)

1. User selects new code in picker.
2. If same as current → close, noop.
3. If different and `COUNT(*) FROM debts > 0` → open **conversion modal** (do **not** persist new currency yet).
4. Modal copy: *"Switching from KES to USD"* + rate field: `1 KES = [____] USD`.
5. As rate is entered, show live preview: *Total owed: KSh 45,000 → $348* (using `formatCurrency` + computed total).
6. **Confirm conversion** → run conversion transaction → `saveDefaultCurrency` → invalidate queries → `runReminderSync()`.
7. **Cancel / dismiss** → revert picker selection; settings row unchanged; DB untouched (D5).

### 6.4 Add debt / record payment

- Amount prefix label reads from `useSettingsStore.defaultCurrency` via shared formatter — **no hardcoded KES**.
- New debts: `debtRepository.create` should use settings currency (`input.currency ?? settingsStore.defaultCurrency`), not `APP_CONFIG` directly.

---

## 7. Acceptance criteria

### 7.1 OS bootstrap

- [ ] Fresh install, no `storageKeys.settings` entry → currency saved from OS locale.
- [ ] `en-KE` → `KES`, `en-US` → `USD`, `en-GB` → `GBP` (via `Intl` / region).
- [ ] Ambiguous locale → `USD`.
- [ ] Upgrade with `defaultCurrency: "KES"` persisted → stays `KES` regardless of OS.

### 7.2 Settings picker

- [ ] Currency row is tappable (chevron, same pattern as reminder time).
- [ ] Sheet lists all ISO 4217 codes with search (code + English name, e.g. `KES — Kenyan Shilling`).
- [ ] Current currency is visually indicated (checkmark or highlight).

### 7.3 Conversion

- [ ] Triggered only when new code ≠ current **and** `debts` table non-empty.
- [ ] Rate field: positive number, up to 8 decimal places.
- [ ] Preview shows aggregate total owed (sum of remaining across all non-archived debts — same definition as Home hero) before and after.
- [ ] Confirm runs inside a **single SQLite transaction**:
  - `UPDATE debts SET original_amount = ROUND(original_amount * rate), currency = :newCode`
  - `UPDATE payments SET amount = ROUND(amount * rate)` (all payments)
  - `UPDATE activity_events SET amount = ROUND(amount * rate) WHERE amount IS NOT NULL`
- [ ] On success: preference saved, all query keys invalidated (`debtKeys`, `activityKeys`, `peopleKeys`, `reminderKeys`), `runReminderSync()`.
- [ ] On cancel: no preference change, no DB change.
- [ ] On failure: transaction rolls back, show error toast, preference unchanged.

### 7.4 Display

- [ ] `formatCurrency(45000, 'KES')` → `KSh 45,000` (or locale-equivalent).
- [ ] `formatCurrency(348, 'USD')` → `$348`.
- [ ] Obscure/invalid code falls back to `XYZ 1,234` style.
- [ ] No screen hardcodes `KES` prefix.

### 7.5 Regression

- [ ] Seed sample data → change KES → USD with rate → Home, Debts, People, Activity, Debt detail totals match converted values.
- [ ] Reminder notification copy uses new currency after sync.
- [ ] Dev reset database preserves currency preference (existing behavior).

---

## 8. Technical design

### 8.1 Source of truth

| Layer | Field | Role |
|-------|-------|------|
| AsyncStorage | `settings.defaultCurrency` | Persisted user preference |
| Zustand | `useSettingsStore.defaultCurrency` | Runtime reads (screens, create debt) |
| SQLite | `debts.currency` | Denormalized on every debt; updated in bulk on conversion |
| `payments` | *(no currency column)* | Inherits display currency from parent debt |
| `activity_events` | `amount` only | Denormalized; must convert with debts |

`APP_CONFIG.defaultCurrency` (`"KES"`) remains the compile-time fallback when store is not yet hydrated.

### 8.2 OS detection — `detectCurrencyFromOs()`

**New file:** `src/features/settings/lib/detect-currency-from-os.ts`

```ts
// Pseudocode
import { getLocales } from "expo-localization";

export function detectCurrencyFromOs(): string {
  const locale = getLocales()[0];
  // Prefer region-derived currency via Intl
  const tag = locale.regionCode
    ? `en-${locale.regionCode}`
    : locale.languageTag ?? "en-US";
  try {
    const parts = new Intl.NumberFormat(tag, {
      style: "currency",
      currency: "USD", // probe
    }).resolvedOptions();
    // Use region → currency mapping table OR:
    const currency = new Intl.DisplayNames([tag], { type: "currency" });
    // Practical approach: maintain ISO_REGION_TO_CURRENCY map for common regions
    // + Intl.NumberFormat with locale currency from region
  } catch { /* fall through */ }
  return "USD";
}
```

**Implementation note:** Use `Intl.NumberFormat(localeTag, { style: "currency", currency: "XXX" })` is not valid. Preferred approach:

1. Map `locale.regionCode` → currency via a small static table (covers all ISO 4217 region defaults) **or** use `expo-localization` + `Intl` with `new Intl.Locale(tag).maximize()` where available.
2. Validate result against the ISO list; if not in list → `USD`.

Call from `bootstrapCurrency()` only when `loadPersistedSettings()?.defaultCurrency` is undefined.

### 8.3 ISO currency list — `src/features/settings/lib/currencies.ts`

- Export `CURRENCIES: { code: string; name: string }[]` — full ISO 4217.
- Source: static JSON or generated list committed to repo (~180 entries). Do **not** fetch at runtime.
- `isValidCurrencyCode(code: string): boolean` for validation.

### 8.4 Conversion service — `convertAllAmountsToCurrency()`

**New file:** `src/features/settings/lib/convert-currency.ts`

```ts
type ConvertCurrencyInput = {
  fromCurrency: string;
  toCurrency: string;
  rate: number; // 1 unit of fromCurrency = rate units of toCurrency
};

export async function convertAllAmountsToCurrency(
  input: ConvertCurrencyInput,
): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE debts SET original_amount = CAST(ROUND(original_amount * ?) AS INTEGER), currency = ?`,
      [input.rate, input.toCurrency],
    );
    await db.runAsync(
      `UPDATE payments SET amount = CAST(ROUND(amount * ?) AS INTEGER)`,
      [input.rate],
    );
    await db.runAsync(
      `UPDATE activity_events SET amount = CAST(ROUND(amount * ?) AS INTEGER) WHERE amount IS NOT NULL`,
      [input.rate],
    );
  });
}
```

**New repository helper:** `debtRepository.hasAnyDebts(): Promise<boolean>` — `SELECT EXISTS(SELECT 1 FROM debts LIMIT 1)`.

**Preview total:** reuse existing aggregate — `SUM(original_amount) - SUM(payments)` across debts, or expose `debtRepository.getTotalRemaining(): Promise<number>` for the modal preview.

### 8.5 `formatCurrency` upgrade

**File:** `src/lib/utils/formatters.ts`

```ts
export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
```

- Default currency param: read from caller; list screens pass `useSettingsStore.defaultCurrency` or per-debt `currency` from view models.
- **Whole units only** — `maximumFractionDigits: 0` (unchanged product rule from persistence PRD).

**New helper (optional):** `formatCurrencyCode(currency: string): string` — short label for amount inputs (e.g. `KSh`, `$`, or `USD` when symbol is ambiguous).

### 8.6 UI components

| Component | File | Notes |
|-----------|------|-------|
| `CurrencyPickerSheet` | `src/features/settings/components/currency-picker-sheet.tsx` | Search + FlashList of ISO codes; pattern from `person-picker-sheet` search |
| `CurrencyConversionModal` | `src/features/settings/components/currency-conversion-modal.tsx` | Rate input, live preview, Confirm / Cancel |
| Settings row | `settings-screen.tsx` | Make currency row pressable; wire picker + modal |

### 8.7 Hook — `useChangeCurrency`

**New file:** `src/features/settings/hooks/use-change-currency.ts`

Orchestrates:

1. Check `hasAnyDebts()`.
2. No debts → `saveDefaultCurrency`.
3. Has debts → open conversion modal state; on confirm → `convertAllAmountsToCurrency` → `saveDefaultCurrency` → invalidate all → `runReminderSync`.

### 8.8 Files to touch

| File | Change |
|------|--------|
| `package.json` | Add `expo-localization` |
| `src/app/_layout.tsx` | Call `bootstrapCurrency()` in startup `Promise.all` |
| `src/constants/config.ts` | Keep `defaultCurrency: "KES"` as fallback only |
| `src/lib/utils/formatters.ts` | `Intl.NumberFormat` |
| `src/features/settings/screens/settings-screen.tsx` | Tappable currency row |
| `src/features/settings/lib/detect-currency-from-os.ts` | **New** |
| `src/features/settings/lib/currencies.ts` | **New** |
| `src/features/settings/lib/convert-currency.ts` | **New** |
| `src/features/settings/lib/bootstrap-currency.ts` | **New** — wraps detect + save |
| `src/features/settings/components/currency-picker-sheet.tsx` | **New** |
| `src/features/settings/components/currency-conversion-modal.tsx` | **New** |
| `src/features/settings/hooks/use-change-currency.ts` | **New** |
| `src/features/debts/repositories/debt-repository.ts` | `hasAnyDebts`, `getTotalRemaining`; create uses settings currency |
| `src/features/debts/screens/add-debt-screen.tsx` | Remove hardcoded `KES` |
| `src/features/debts/screens/record-payment-screen.tsx` | Remove hardcoded `KES` |
| `src/features/onboarding/screens/onboarding-screen.tsx` | Use `formatCurrency` for preview |
| `src/features/debts/lib/build-activity-view.ts` | Already passes `event.debtCurrency` — verify post-conversion |
| `src/features/reminders/lib/reminder-scheduler.ts` | Already takes `currency` param — verify after sync |

**No schema migration** — `debts.currency` column already exists.

### 8.9 Query invalidation

On successful conversion, invalidate the same keys as `use-record-payment`:

```ts
await queryClient.invalidateQueries({ queryKey: debtKeys.all });
await queryClient.invalidateQueries({ queryKey: activityKeys.all });
await queryClient.invalidateQueries({ queryKey: peopleKeys.all });
await queryClient.invalidateQueries({ queryKey: reminderKeys.all });
```

### 8.10 Reminder bucket key (forward-compat)

`reminders-grouping-prd.md` notes bucket key will add `currency` when multi-currency lands. Today all debts share one currency — no migration needed. After conversion, `runReminderSync()` reschedules with new formatted amounts.

---

## 9. UX copy (draft)

| Surface | Copy |
|---------|------|
| Settings label | Default currency |
| Picker search placeholder | Search currencies |
| Conversion modal title | Switch to {newCode}? |
| Rate label | `1 {oldCode} =` [input] `{newCode}` |
| Preview | Total owed: {before} → {after} |
| Confirm button | Convert & switch |
| Cancel button | Cancel |
| Success toast | Switched to {newCode} |
| Error toast | Couldn't convert amounts. Nothing was changed. |

Tone: calm, factual. No alarm about "irreversible" — the preview is the safety net.

---

## 10. Implementation stages

One feature branch; each stage leaves the app buildable.

| Stage | Scope | Review focus |
|-------|-------|--------------|
| **1 — Foundation** | `expo-localization`, `currencies.ts`, `detect-currency-from-os.ts`, `bootstrap-currency.ts`, wire `_layout.tsx` | OS detect + fallback; no UI yet |
| **2 — Formatting** | Upgrade `formatCurrency`; remove hardcoded `KES` in add-debt, record-payment, onboarding | Symbol display; whole units |
| **3 — Picker** | `CurrencyPickerSheet`, tappable Settings row, instant save when no debts | Search perf; ISO completeness |
| **4 — Conversion** | `convert-currency.ts`, `hasAnyDebts`, `getTotalRemaining`, conversion modal, `use-change-currency` | Transaction atomicity; cancel revert |
| **5 — Polish** | Query invalidation, reminder sync, error toasts, manual test pass | End-to-end regression |

---

## 11. Manual test plan

Use Settings → Developer → Seed sample data (dev builds).

| # | Scenario | Expected |
|---|----------|----------|
| T1 | Fresh install (clear storage), `en-KE` locale | Currency silently set to KES; no modal |
| T2 | Fresh install, ambiguous locale | Currency set to USD |
| T3 | Upgrade with persisted KES | Stays KES |
| T4 | Settings picker, no debts | Select EUR → row shows EUR instantly |
| T5 | Settings picker, seeded debts, select USD | Conversion modal opens; settings still KES until Confirm |
| T6 | Enter rate `0.0077`, preview | Total owed reflects KES total × rate in USD |
| T7 | Cancel conversion modal | Currency row still KES; debt amounts unchanged |
| T8 | Confirm conversion KES → USD | All screens show USD amounts; activity history converted |
| T9 | Add debt after switch | New debt uses USD |
| T10 | Record payment after switch | Payment in USD |
| T11 | Enable reminder, convert currency | Notification copy uses new currency after sync |
| T12 | Invalid rate (0, negative, empty) | Confirm disabled |
| T13 | Search picker for "shilling" | Finds KES, UGX, etc. |

---

## 12. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Rounding drift on remainings | Accept for v1; all amounts rounded independently; preview shows aggregate |
| `Intl` missing symbol for obscure currency | Fallback to code prefix |
| Large DB conversion slow | SQLite updates are fast at Owed scale; wrap in transaction; optional loading state on Confirm |
| User enters inverted rate | Clear label `1 OLD = ___ NEW`; preview catches order-of-magnitude errors |
| Restored backup without settings | Known edge case; document; user can manually convert via Settings |

---

## 13. Agent checklist

- [ ] Read [performance.md](./performance.md) — invalidate queries in mutation only; no new list-query staleTime changes
- [ ] **No schema migration** — reuse `debts.currency`
- [ ] Conversion in **one transaction**; rollback on any failure
- [ ] Cancel conversion = **full revert** (D5)
- [ ] OS detect **only** when no persisted `defaultCurrency` (D6)
- [ ] `debtRepository.create` reads currency from settings store, not `APP_CONFIG`
- [ ] Remove all hardcoded `KES` UI strings
- [ ] `formatCurrency` uses `Intl`, whole units (`maximumFractionDigits: 0`)
- [ ] After conversion: invalidate `debtKeys`, `activityKeys`, `peopleKeys`, `reminderKeys` + `runReminderSync()`
- [ ] Currency picker uses `FlashList` for ISO list performance
- [ ] Do not add onboarding step for currency (D1)

---

## 14. Reference: grilling decision log

| # | Question | Answer |
|---|----------|--------|
| 1 | Fresh install, empty DB | A — silently adopt OS locale |
| 2 | Exchange rate phrasing | A — `1 {old} = ___ {new}` |
| 3 | Before DB write | A — preview total owed + Confirm |
| 4 | Currency picker | B — full ISO 4217 with search |
| 5 | Cancel conversion | A — full revert |
| 6 | Existing users upgrading | A — keep persisted setting |
| 7 | OS detect fallback | A — USD |
| 8 | Conversion scope | A — debts + payments + activity_events |
| 9 | Rate precision | A — up to 8 decimal places |
| 10 | "Has data" trigger | A — any debt row |
| 11 | Display format | B — `Intl.NumberFormat` symbols |
