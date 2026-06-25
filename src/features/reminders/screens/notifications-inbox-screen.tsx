import { useCallback } from "react";

import { StyleSheet, Text, View } from "react-native";

import { router, useFocusEffect } from "expo-router";

import { FlashList } from "@shopify/flash-list";
import { Bell } from "lucide-react-native";

import { NotificationRow } from "@/features/reminders/components/notification-row";
import { useMarkInboxRead } from "@/features/reminders/hooks/use-mark-inbox-read";
import { useRemindersInbox } from "@/features/reminders/hooks/use-reminders-inbox";
import type { ReminderInboxView } from "@/features/reminders/lib/fetch-reminders";

export function NotificationsInboxScreen() {
  const { data: items = [], isPending } = useRemindersInbox();
  const markInboxRead = useMarkInboxRead();

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
    return null;
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Bell color="#B8B8B0" size={20} strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptyCopy}>
          When a promised date arrives, you&apos;ll see a notification here, only on your device.
        </Text>
      </View>
    );
  }

  return (
    <FlashList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
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
    backgroundColor: "#EFEFEC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A4A42",
  },
  emptyCopy: {
    fontSize: 12,
    color: "#B8B8B0",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 240,
  },
});
