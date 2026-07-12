import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import { Pressable, Text, View } from "react-native";

import { type Href, router } from "expo-router";

import type { FlashListRef } from "@shopify/flash-list";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Users } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { DebtSearchBar, type DebtSearchBarRef } from "@/components/debts/debt-search-bar";
import { TabScreen } from "@/components/navigation/tab-screen";
import { FAB_SCROLL_PADDING, FabButton } from "@/components/shared/fab-button";
import { IconButton } from "@/components/shared/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRefreshControl } from "@/hooks/use-refresh-control";
import { selectionChange } from "@/lib/haptics";
import { invalidatePeopleQueries } from "@/lib/query/invalidate-queries";

import { PeopleList } from "../components/people-list";
import { usePeopleList } from "../hooks/use-people-list";
import { filterAndSortPeople } from "../lib/people-list-utils";

export function PeopleScreen() {
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const { data: people = [], isPending } = usePeopleList();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const listRef = useRef<FlashListRef<(typeof people)[number]>>(null);
  const searchRef = useRef<DebtSearchBarRef>(null);

  const visiblePeople = useMemo(
    () => filterAndSortPeople(people, deferredSearchQuery),
    [people, deferredSearchQuery],
  );

  useEffect(() => {
    listRef.current?.scrollToTop({ animated: false });
  }, [deferredSearchQuery]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [searchOpen]);

  const openSearch = useCallback(() => {
    selectionChange();
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchQuery("");
    setSearchOpen(false);
  }, []);

  const openPerson = useCallback((personId: string) => {
    router.push(`/person/${personId}` as Href);
  }, []);

  const openAddPerson = useCallback(() => {
    router.push("/add-person" as Href);
  }, []);

  const handleRefresh = useCallback(() => invalidatePeopleQueries(queryClient), [queryClient]);
  const { refreshControlProps } = useRefreshControl({ onRefresh: handleRefresh });

  const isSearching = searchQuery.trim().length > 0;

  const emptyState = useMemo(
    () => (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          {isSearching ? (
            <Search color={theme.colors.mutedLight} size={20} strokeWidth={1.5} />
          ) : (
            <Users color={theme.colors.mutedLight} size={20} strokeWidth={1.5} />
          )}
        </View>
        <Text style={styles.emptyTitle}>{isSearching ? "No person found." : "No people yet."}</Text>
        <Text style={styles.emptyCopy}>
          {isSearching
            ? "Try searching by name or phone number."
            : "Add people connected to money promises, then log what is unsettled."}
        </Text>
      </View>
    ),
    [isSearching, theme.colors.mutedLight],
  );

  if (isPending) {
    return (
      <TabScreen>
        <LoadingSpinner />
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      <View style={styles.header}>
        {searchOpen ? (
          <>
            <DebtSearchBar
              ref={searchRef}
              onChangeText={setSearchQuery}
              value={searchQuery}
              variant="header"
            />
            <Pressable hitSlop={8} onPress={closeSearch} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>People</Text>
            <IconButton onPress={openSearch}>
              <Search color={theme.colors.text} size={17} strokeWidth={2} />
            </IconButton>
          </>
        )}
      </View>

      <PeopleList
        ref={listRef}
        contentContainerStyle={styles.scroll}
        ListEmptyComponent={emptyState}
        onPersonPress={openPerson}
        people={visiblePeople}
        refreshControlProps={refreshControlProps}
      />

      <FabButton accessibilityLabel="Add person" onPress={openAddPerson} />
    </TabScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
  },
  cancel: {
    flexShrink: 0,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.icon,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: FAB_SCROLL_PADDING,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 24,
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
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  emptyCopy: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 240,
  },
}));
