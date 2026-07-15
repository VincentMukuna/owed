import { useCallback, useEffect, useState } from "react";

import { getItem, setItem } from "@/lib/storage/local-storage";

const VIEW_OPTIONS_VERSION = 1;

type StoredPreference<TPreference> = {
  version: number;
  value: TPreference;
};

type UseViewPreferenceInput<TPreference> = {
  defaultValue: TPreference;
  isValid: (value: unknown) => value is TPreference;
  surface: "activity" | "debts" | "people";
};

export function useViewPreference<TPreference>({
  defaultValue,
  isValid,
  surface,
}: UseViewPreferenceInput<TPreference>) {
  const [value, setValue] = useState(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getItem<unknown>(`view-options/v${VIEW_OPTIONS_VERSION}/${surface}`)
      .then((stored) => {
        if (cancelled || typeof stored !== "object" || stored === null) {
          return;
        }

        const candidate = stored as Partial<StoredPreference<unknown>>;
        if (candidate.version === VIEW_OPTIONS_VERSION && isValid(candidate.value)) {
          setValue(candidate.value);
        }
      })
      .catch(() => {
        // Presentation preferences are optional. Invalid/unavailable storage
        // intentionally falls back to the product default.
      })
      .finally(() => {
        if (!cancelled) {
          setIsHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isValid, surface]);

  const update = useCallback(
    (next: TPreference) => {
      setValue(next);
      void setItem<StoredPreference<TPreference>>(
        `view-options/v${VIEW_OPTIONS_VERSION}/${surface}`,
        {
          version: VIEW_OPTIONS_VERSION,
          value: next,
        },
      ).catch(() => {
        // Keep the in-memory choice even if optional preference persistence fails.
      });
    },
    [surface],
  );

  const reset = useCallback(() => update(defaultValue), [defaultValue, update]);

  return { isHydrated, reset, setValue: update, value };
}
