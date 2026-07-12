import { useCallback } from "react";

import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { Stack, router, useFocusEffect } from "expo-router";

import { FlashList } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, MoreHorizontal, X } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import {
  LIST_LEADING_INSET_ICON_MD,
  ListRowContainer,
} from "@/components/shared/list-inset-divider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NotificationRow } from "@/features/reminders/components/notification-row";
import {
  type NotificationsAction,
  NotificationsActionsMenu,
} from "@/features/reminders/components/notifications-actions-menu";
import { useArchiveInbox } from "@/features/reminders/hooks/use-archive-inbox";
import { useMarkInboxRead } from "@/features/reminders/hooks/use-mark-inbox-read";
import { useRemindersInbox } from "@/features/reminders/hooks/use-reminders-inbox";
import type { ReminderInboxView } from "@/features/reminders/view-models";
import { HOME_ROUTE } from "@/lib/navigation/routes";
import { invalidateReminderQueries } from "@/lib/query/invalidate-queries";

export function NotificationsInboxScreen() {
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const { data: items = [], isPending } = useRemindersInbox();
  const { isPending: isArchivingInbox, mutate: archiveInbox } = useArchiveInbox();
  const markInboxRead = useMarkInboxRead();

  const handleRefresh = useCallback(() => invalidateReminderQueries(queryClient), [queryClient]);

  const closeNotifications = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(HOME_ROUTE);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void markInboxRead.mutateAsync();
    }, [markInboxRead]),
  );

  const openDebt = useCallback((debtId: string) => {
    router.push(`/debt/${debtId}`);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: ReminderInboxView; index: number }) => (
      <ListRowContainer leadingInset={LIST_LEADING_INSET_ICON_MD} showDivider={index > 0}>
        <NotificationRow item={item} onPress={openDebt} />
      </ListRowContainer>
    ),
    [openDebt],
  );

  const keyExtractor = useCallback((item: ReminderInboxView) => item.id, []);

  const confirmClearInbox = useCallback(() => {
    if (items.length === 0 || isArchivingInbox) {
      return;
    }

    Alert.alert(
      "Clear Inbox?",
      "Notifications will be archived and hidden from this inbox. Your debts won't be changed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Inbox",
          style: "destructive",
          onPress: () => archiveInbox(),
        },
      ],
    );
  }, [archiveInbox, isArchivingInbox, items.length]);

  const handleNotificationsAction = useCallback(
    (action: NotificationsAction) => {
      if (action === "refresh") {
        void handleRefresh();
        return;
      }

      confirmClearInbox();
    },
    [confirmClearInbox, handleRefresh],
  );

  if (isPending) {
    return <LoadingSpinner />;
  }

  const headerRight = () => (
    <NotificationsActionsMenu canClearInbox={items.length > 0} onAction={handleNotificationsAction}>
      <Pressable hitSlop={10} style={styles.headerMenuTrigger}>
        <MoreHorizontal color={theme.colors.icon} size={17} strokeWidth={2} />
      </Pressable>
    </NotificationsActionsMenu>
  );
  const headerLeft = () => (
    <Pressable hitSlop={10} onPress={closeNotifications} style={styles.headerMenuTrigger}>
      <X color={theme.colors.icon} size={18} strokeWidth={2} />
    </Pressable>
  );

  if (items.length === 0) {
    return (
      <>
        <Stack.Screen options={{ headerLeft, headerRight }} />
        <ScrollView contentContainerStyle={styles.emptyScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Bell color={theme.colors.mutedLight} size={20} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyCopy}>
              When a promised date arrives, you&apos;ll see a notification here, only on your
              device.
            </Text>
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerLeft, headerRight }} />
      <FlashList
        contentContainerStyle={styles.list}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </>
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
  headerMenuTrigger: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
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
