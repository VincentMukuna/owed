import { useCallback } from "react";

import { RefreshControl, ScrollView, Text, View } from "react-native";

import { router, useFocusEffect } from "expo-router";

import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { NotificationsScreenSkeleton } from "@/components/ui/screen-skeletons";
import { NotificationRow } from "@/features/reminders/components/notification-row";
import { useMarkInboxRead } from "@/features/reminders/hooks/use-mark-inbox-read";
import { useRemindersInbox } from "@/features/reminders/hooks/use-reminders-inbox";
import type { ReminderInboxView } from "@/features/reminders/lib/fetch-reminders";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { invalidateReminderQueries } from "@/lib/query/invalidate-queries";

export function NotificationsInboxScreen() {
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const { data: items = [], isPending } = useRemindersInbox();
  const markInboxRead = useMarkInboxRead();

  const handleRefresh = useCallback(() => invalidateReminderQueries(queryClient), [queryClient]);
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  useFocusEffect(
    useCallback(() => {
      void markInboxRead.mutateAsync();
    }, [markInboxRead]),
  );

  const openDebt = useCallback((debtId: string) => {
    router.push(`/debt/${debtId}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ReminderInboxView }) => <NotificationRow item={item} onPress={openDebt} />,
    [openDebt],
  );

  const keyExtractor = useCallback((item: ReminderInboxView) => item.id, []);

  if (isPending) {
    return <NotificationsScreenSkeleton />;
  }

  if (items.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={styles.emptyScroll}
        refreshControl={<RefreshControl {...refreshControlProps} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Bell color={theme.colors.mutedLight} size={20} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyCopy}>
            When a promised date arrives, you&apos;ll see a notification here, only on your device.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <FlashList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={keyExtractor}
      refreshControl={<RefreshControl {...refreshControlProps} />}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  emptyScroll: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.icon,
  },
  emptyCopy: {
    fontSize: 12,
    color: theme.colors.mutedLight,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 240,
  },
}));
