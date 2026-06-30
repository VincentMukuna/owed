import { forwardRef, memo, useCallback } from "react";

import { RefreshControl, type RefreshControlProps } from "react-native";

import { FlashList, type FlashListRef } from "@shopify/flash-list";

import { DebtCard } from "@/components/debts/debt-card";
import type { DebtCardView } from "@/features/debts/view-models";

type DebtListProps = {
  debts: DebtCardView[];
  onDebtPress: (debtId: string) => void;
  contentContainerStyle?: object;
  ListEmptyComponent?: React.ReactElement | null;
  ListHeaderComponent?: React.ReactElement | null;
  refreshControlProps?: RefreshControlProps;
  showDirectionCue?: boolean;
};

const DebtListInner = forwardRef<FlashListRef<DebtCardView>, DebtListProps>(
  (
    {
      debts,
      onDebtPress,
      contentContainerStyle,
      ListEmptyComponent,
      ListHeaderComponent,
      refreshControlProps,
      showDirectionCue = false,
    },
    ref,
  ) => {
    const renderItem = useCallback(
      ({ item }: { item: DebtCardView }) => (
        <DebtCard
          debt={item}
          onPress={() => onDebtPress(item.id)}
          showDirectionCue={showDirectionCue}
        />
      ),
      [onDebtPress, showDirectionCue],
    );

    const keyExtractor = useCallback((item: DebtCardView) => item.id, []);

    return (
      <FlashList
        ref={ref}
        contentContainerStyle={contentContainerStyle}
        data={debts}
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
