import { forwardRef, memo, useCallback } from "react";

import { RefreshControl, type RefreshControlProps, StyleSheet, View } from "react-native";

import { FlashList, type FlashListRef } from "@shopify/flash-list";

import { DebtCard } from "@/components/debts/debt-card";
import type { DebtCardView } from "@/features/debts/view-models";

const ITEM_SEPARATOR_HEIGHT = 10;

type DebtListProps = {
  debts: DebtCardView[];
  onDebtPress: (debtId: string) => void;
  contentContainerStyle?: object;
  ListEmptyComponent?: React.ReactElement | null;
  ListHeaderComponent?: React.ReactElement | null;
  refreshControlProps?: RefreshControlProps;
};

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const DebtListInner = forwardRef<FlashListRef<DebtCardView>, DebtListProps>(
  (
    {
      debts,
      onDebtPress,
      contentContainerStyle,
      ListEmptyComponent,
      ListHeaderComponent,
      refreshControlProps,
    },
    ref,
  ) => {
    const renderItem = useCallback(
      ({ item }: { item: DebtCardView }) => (
        <DebtCard debt={item} onPress={() => onDebtPress(item.id)} />
      ),
      [onDebtPress],
    );

    const keyExtractor = useCallback((item: DebtCardView) => item.id, []);

    return (
      <FlashList
        ref={ref}
        contentContainerStyle={contentContainerStyle}
        data={debts}
        ItemSeparatorComponent={ItemSeparator}
        keyExtractor={keyExtractor}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        refreshControl={
          refreshControlProps ? <RefreshControl {...refreshControlProps} /> : undefined
        }
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    );
  },
);

DebtListInner.displayName = "DebtList";

export const DebtList = memo(DebtListInner);

DebtList.displayName = "DebtList";

const styles = StyleSheet.create({
  separator: {
    height: ITEM_SEPARATOR_HEIGHT,
  },
});
