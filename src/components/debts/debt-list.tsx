import { forwardRef, memo, useCallback } from "react";

import { RefreshControl, type RefreshControlProps } from "react-native";

import { FlashList, type FlashListRef } from "@shopify/flash-list";

import { DebtCard } from "@/components/debts/debt-card";
import {
  LIST_LEADING_INSET_AVATAR_MD,
  ListRowContainer,
} from "@/components/shared/list-inset-divider";
import type { DebtAction } from "@/features/debts/components/debt-actions-menu";
import type { DebtCardView } from "@/features/debts/view-models";

type DebtListProps = {
  debts: DebtCardView[];
  onDebtAction?: (action: DebtAction, debt: DebtCardView) => void;
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
      onDebtAction,
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
      ({ item, index }: { item: DebtCardView; index: number }) => (
        <ListRowContainer leadingInset={LIST_LEADING_INSET_AVATAR_MD} showDivider={index > 0}>
          <DebtCard
            debt={item}
            onAction={onDebtAction}
            onPress={() => onDebtPress(item.id)}
            showDirectionCue={showDirectionCue}
          />
        </ListRowContainer>
      ),
      [onDebtAction, onDebtPress, showDirectionCue],
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
