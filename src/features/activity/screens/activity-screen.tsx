import { useCallback, useEffect, useMemo, useRef } from "react";

import { RefreshControl, ScrollView, Text, View } from "react-native";

import { Stack } from "expo-router";

import { BottomSheetModal } from "@gorhom/bottom-sheet";
import type { FlashListRef } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { ActivityList } from "@/components/activity/activity-list";
import { PressableScale } from "@/components/shared/pressable-scale";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useActivities } from "@/features/activity/hooks/use-activities";
import {
  ACTIVITY_SORT_CRITERIA,
  ACTIVITY_SORT_DIRECTIONS,
  DEFAULT_ACTIVITY_SORT,
  isActivitySortPreference,
} from "@/features/activity/lib/activity-sort";
import type { ActivityView } from "@/features/debts/view-models";
import { SortOptionsContent } from "@/features/view-options/components/sort-options-content";
import { ViewOptionsSheet } from "@/features/view-options/components/view-options-sheet";
import { useViewPreference } from "@/features/view-options/hooks/use-view-preference";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { selectionChange } from "@/lib/haptics";
import { invalidateActivityQueries } from "@/lib/query/invalidate-queries";

export function ActivityScreen() {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const listRef = useRef<FlashListRef<ActivityView>>(null);
  const viewOptionsRef = useRef<BottomSheetModal>(null);
  const {
    isHydrated: isSortHydrated,
    reset: resetSort,
    setValue: setSort,
    value: sort,
  } = useViewPreference({
    defaultValue: DEFAULT_ACTIVITY_SORT,
    isValid: isActivitySortPreference,
    surface: "activity",
  });
  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage } = useActivities(
    sort.direction,
    isSortHydrated,
  );

  const activities = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const sortIsDefault = sort.direction === DEFAULT_ACTIVITY_SORT.direction;

  useEffect(() => {
    listRef.current?.scrollToTop({ animated: false });
  }, [sort.direction]);

  const handleRefresh = useCallback(() => invalidateActivityQueries(queryClient), [queryClient]);
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const openViewOptions = useCallback(() => {
    selectionChange();
    viewOptionsRef.current?.present();
  }, []);

  const headerRight = useCallback(
    () => (
      <PressableScale
        accessibilityLabel={`Sort activity${sortIsDefault ? "" : ", oldest first active"}`}
        accessibilityRole="button"
        hitSlop={10}
        onPress={openViewOptions}
        style={styles.headerAction}
      >
        <ArrowUpDown
          color={sortIsDefault ? theme.colors.icon : theme.colors.primary}
          size={17}
          strokeWidth={2}
        />
      </PressableScale>
    ),
    [openViewOptions, sortIsDefault, theme.colors.icon, theme.colors.primary],
  );

  if (isPending || !isSortHydrated) {
    return (
      <View style={styles.screen}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerRight }} />
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
            ref={listRef}
            activities={activities}
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            isFetchingNextPage={isFetchingNextPage}
            onEndReached={handleEndReached}
            refreshControlProps={refreshControlProps}
          />
        )}
      </View>

      <ViewOptionsSheet
        isDefault={sortIsDefault}
        onReset={resetSort}
        sheetRef={viewOptionsRef}
        snapPoint="38%"
      >
        <SortOptionsContent
          criteria={ACTIVITY_SORT_CRITERIA}
          criterion={sort.criterion}
          direction={sort.direction}
          directions={ACTIVITY_SORT_DIRECTIONS}
          onSelectCriterion={() => {}}
          onSelectDirection={(direction) => setSort({ criterion: "chronology", direction })}
        />
      </ViewOptionsSheet>
    </>
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
  headerAction: {
    minWidth: 36,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
  },
}));
