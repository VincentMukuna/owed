import { useCallback, useState } from "react";

import type { RefreshControlProps } from "react-native";

import { useUnistyles } from "react-native-unistyles";

type UseRefreshControlOptions = {
  onRefresh: () => Promise<unknown>;
};

export function useRefreshControl({ onRefresh }: UseRefreshControlOptions) {
  const { theme } = useUnistyles();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const refreshControlProps: RefreshControlProps = {
    colors: [theme.colors.primary],
    onRefresh: handleRefresh,
    refreshing,
    tintColor: theme.colors.primary,
  };

  return { refreshControlProps, refreshing, onRefresh: handleRefresh };
}
