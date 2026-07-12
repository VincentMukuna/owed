import { useCallback, useMemo } from "react";

import { RefreshControl, ScrollView, Text, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";

import { ActivityList } from "@/components/activity/activity-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useActivities } from "@/features/activity/hooks/use-activities";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { invalidateActivityQueries } from "@/lib/query/invalidate-queries";

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } = useActivities();

  const activities = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const handleRefresh = useCallback(() => invalidateActivityQueries(queryClient), [queryClient]);
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isPending) {
    return (
      <View style={styles.screen}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {activities.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={<RefreshControl {...refreshControlProps} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No activity yet.</Text>
          </View>
        </ScrollView>
      ) : (
        <ActivityList
          activities={activities}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          isFetchingNextPage={isFetchingNextPage}
          onEndReached={handleEndReached}
          refreshControlProps={refreshControlProps}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyScroll: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.muted,
  },
}));
